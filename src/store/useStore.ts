import { create } from "zustand";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";

export type Sentiment = "positive" | "neutral" | "negative";
export type Role = "owner" | "manager" | "staff";
export type TicketStatus = "open" | "in-progress" | "resolved";
export type StaffStatus = "active" | "break" | "off";

export interface Feedback {
  id: string;
  businessId: string;
  staffId?: string;
  transcript: string;
  sentiment: Sentiment;
  tags: string[];
  audioUrl?: string;
  createdAt: number;
  metadata?: {
    source?: string;
    orderId?: string;
    userId?: string;
    qrId?: string;
  };
}

export interface Ticket {
  id: string;
  feedbackId: string;
  businessId: string;
  assignedTo?: string;
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Staff {
  id: string;
  name: string;
  avatarUrl: string;
  role: Role;
  status?: StaffStatus;
  impression?: number; // 0-100 score
}

export interface Business {
  id: string;
  name: string;
  logo?: string;
  staff: Staff[];
  customPrompt: string;
  offers?: { title: string; description: string }[];
  loyaltyConfig?: {
    feedbackThreshold: number;
    discountValue: string;
    isEnabled: boolean;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    isAuto?: boolean;
  };
}

interface AppState {
  feedbacks: Feedback[];
  businesses: Business[];
  tickets: Ticket[];
  userProfile: any | null;
  isProfileLoaded: boolean;
  addFeedback: (feedback: Feedback) => void;
  setFeedbacks: (feedbacks: Feedback[]) => void;
  setTickets: (tickets: Ticket[]) => void;
  setBusinesses: (businesses: Business[]) => void;
  setUserProfile: (profile: any | null) => void;
  setIsProfileLoaded: (loaded: boolean) => void;
  getBusiness: (id: string) => Business | undefined;
  updateBusiness: (id: string, updates: Partial<Business>) => Promise<void>;
  getStaffFeedbacks: (staffId: string) => Feedback[];
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  feedbacks: [],
  businesses: [],
  tickets: [],
  userProfile: null,
  isProfileLoaded: false,
  addFeedback: (feedback) =>
    set((state) => {
      const newState = { feedbacks: [feedback, ...state.feedbacks] } as Partial<AppState>;
      // Auto-create ticket for negative feedback
      if (feedback.sentiment === "negative") {
        const newTicket: Ticket = {
          id: Math.random().toString(36).substring(7),
          feedbackId: feedback.id,
          businessId: feedback.businessId,
          status: "open",
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        newState.tickets = [newTicket, ...state.tickets];
      }
      return newState;
    }),
  setFeedbacks: (feedbacks) => set({ feedbacks }),
  setTickets: (tickets) => set({ tickets }),
  setBusinesses: (businesses) => set({ businesses }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setIsProfileLoaded: (isProfileLoaded) => set({ isProfileLoaded }),
  getBusiness: (id) => get().businesses.find((b) => b.id === id),
  updateBusiness: async (id, updates) => {
    try {
      const businessRef = doc(db, "businesses", id);
      await updateDoc(businessRef, updates);
      // Local state will be updated by onSnapshot in App.tsx
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `businesses/${id}`);
    }
  },
  getStaffFeedbacks: (staffId) =>
    get().feedbacks.filter((f) => f.staffId === staffId),
  addTicket: (ticket) => 
    set((state) => ({ tickets: [ticket, ...state.tickets] })),
  updateTicket: async (id, updates) => {
    try {
      const ticketRef = doc(db, "tickets", id);
      await updateDoc(ticketRef, { ...updates, updatedAt: Date.now() });
      // Local state will be updated by onSnapshot in App.tsx
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
    }
  }
}));
