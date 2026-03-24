import { create } from "zustand";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";

export type Sentiment = "positive" | "neutral" | "negative";
export type Role = "owner" | "manager" | "staff";
export type TicketStatus = "open" | "in-progress" | "resolved";

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
}

export interface Business {
  id: string;
  name: string;
  staff: Staff[];
  customPrompt: string;
}

interface AppState {
  feedbacks: Feedback[];
  businesses: Business[];
  tickets: Ticket[];
  addFeedback: (feedback: Feedback) => void;
  setFeedbacks: (feedbacks: Feedback[]) => void;
  setTickets: (tickets: Ticket[]) => void;
  setBusinesses: (businesses: Business[]) => void;
  getBusiness: (id: string) => Business | undefined;
  updateBusiness: (id: string, updates: Partial<Business>) => Promise<void>;
  getStaffFeedbacks: (staffId: string) => Feedback[];
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
}

const mockStaff: Staff[] = [
  { id: "s1", name: "Ravi Kumar", avatarUrl: "https://i.pravatar.cc/150?u=s1", role: "manager" },
  {
    id: "s2",
    name: "Priya Sharma",
    avatarUrl: "https://i.pravatar.cc/150?u=s2",
    role: "staff"
  },
  { id: "s3", name: "Amit Singh", avatarUrl: "https://i.pravatar.cc/150?u=s3", role: "staff" },
];

const mockBusinesses: Business[] = [
  {
    id: "b1",
    name: "Urban Glow Salon",
    staff: mockStaff,
    customPrompt: "Bas 5 seconds mein batao – service kaisi thi 🙂"
  },
];

const mockFeedbacks: Feedback[] = [
  {
    id: "f1",
    businessId: "b1",
    staffId: "s1",
    transcript: "Service was very fast and Ravi was very polite. Thank you!",
    sentiment: "positive",
    tags: ["Behaviour", "Speed"],
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "f2",
    businessId: "b1",
    staffId: "s2",
    transcript: "The wait time was too long, but Priya did a good job.",
    sentiment: "neutral",
    tags: ["Delay", "Quality"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "f3",
    businessId: "b1",
    staffId: "s3",
    transcript: "Very bad experience. Place was not clean.",
    sentiment: "negative",
    tags: ["Cleanliness"],
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
];

const mockTickets: Ticket[] = [
  {
    id: "t1",
    feedbackId: "f3",
    businessId: "b1",
    assignedTo: "s1",
    status: "open",
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
  }
];

export const useStore = create<AppState>((set, get) => ({
  feedbacks: mockFeedbacks,
  businesses: mockBusinesses,
  tickets: mockTickets,
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
