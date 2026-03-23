/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebase";
import FeedbackFlow from "./pages/FeedbackFlow";
import Dashboard from "./pages/Dashboard";
import StaffPerformance from "./pages/StaffPerformance";
import Settings from "./pages/Settings";
import Tickets from "./pages/Tickets";
import Login from "./pages/Login";
import Preloader from "./components/ui/preloader";
import { AnimeNavBar } from "./components/ui/anime-navbar";
import { LayoutDashboard, Ticket, Users, Settings as SettingsIcon, LogOut } from "lucide-react";
import { ThemeProvider } from "./components/theme-provider";
import { ThemeToggle } from "./components/ui/theme-toggle";

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
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
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

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
    </ThemeProvider>
  );
}
