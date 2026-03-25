/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, Component, ErrorInfo, ReactNode } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, limit, where, doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import FeedbackFlow from "./pages/FeedbackFlow";
import Dashboard from "./pages/Dashboard";
import StaffPerformance from "./pages/StaffPerformance";
import Settings from "./pages/Settings";
import Tickets from "./pages/Tickets";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Preloader from "./components/ui/preloader";
import { AnimeNavBar } from "./components/ui/anime-navbar";
import { LayoutDashboard, Ticket, Users, Settings as SettingsIcon, LogOut, AlertTriangle } from "lucide-react";
import { useStore } from "./store/useStore";
import { handleFirestoreError, OperationType } from "./lib/firebase-utils";

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let title = "Application Error";
      let errorMessage = "Something went wrong. We're working to fix it.";
      let isFirestoreError = false;

      try {
        const parsedError = JSON.parse(this.state.error?.message || "{}");
        if (parsedError.error) {
          isFirestoreError = true;
          title = "Database Connection Issue";
          errorMessage = "We're having trouble connecting to our database. This could be a temporary network issue.";
          console.error("Firestore Error Details:", parsedError);
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
              >
                Reload Application
              </button>
              
              <div className="flex gap-3">
                <a
                  href="mailto:help.urbanhive@gmail.com"
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all text-sm flex items-center justify-center gap-2"
                >
                  Contact Support
                </a>
                <button
                  onClick={() => window.location.href = "/dashboard"}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all text-sm"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
            
            {isFirestoreError && (
              <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Error Code: FS_AUTH_01
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const navItems = [
  { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { name: "Tickets", url: "/dashboard/tickets", icon: Ticket },
  { name: "Staff", url: "/dashboard/staff", icon: Users },
  { name: "Settings", url: "/dashboard/settings", icon: SettingsIcon },
];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function DashboardLayout() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      <AnimeNavBar items={navItems} />
      <div className="flex-1 overflow-y-auto pt-24">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/staff" element={<StaffPerformance />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const userProfile = useStore((state) => state.userProfile);
  const setUserProfile = useStore((state) => state.setUserProfile);
  const setIsProfileLoaded = useStore((state) => state.setIsProfileLoaded);
  const setFeedbacks = useStore((state) => state.setFeedbacks);
  const setTickets = useStore((state) => state.setTickets);
  const setBusinesses = useStore((state) => state.setBusinesses);

  // Safety timeout for preloader
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile to get businessId
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // If profile missing, we might need to create it or handle it
            console.warn("User profile missing for UID:", currentUser.uid);
            setUserProfile({ businessId: null }); // Don't block, but no sync
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile({ businessId: null });
        } finally {
          setIsProfileLoaded(true);
        }
      } else {
        setUserProfile(null);
        setIsProfileLoaded(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userProfile?.businessId || !user) return;

    const businessId = userProfile.businessId;

    // Global Firestore Sync scoped to businessId
    const feedbackQuery = query(
      collection(db, "feedback"), 
      where("businessId", "==", businessId),
      orderBy("createdAt", "desc"), 
      limit(100)
    );
    const unsubscribeFeedback = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbacks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis() || Date.now()
      })) as any[];
      setFeedbacks(feedbacks);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "feedback");
    });

    const ticketsQuery = query(
      collection(db, "tickets"), 
      where("businessId", "==", businessId),
      orderBy("createdAt", "desc"), 
      limit(100)
    );
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis() || Date.now(),
        updatedAt: doc.data().updatedAt?.toMillis() || Date.now()
      })) as any[];
      setTickets(tickets);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "tickets");
    });

    const businessDocRef = doc(db, "businesses", businessId);
    const unsubscribeBusiness = onSnapshot(businessDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBusinesses([{ id: docSnap.id, ...docSnap.data() } as any]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "businesses");
    });

    return () => {
      unsubscribeFeedback();
      unsubscribeTickets();
      unsubscribeBusiness();
    };
  }, [userProfile, user, setFeedbacks, setTickets, setBusinesses]);

  return (
    <ErrorBoundary>
      {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/feedback/:businessId" element={<FeedbackFlow />} />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
