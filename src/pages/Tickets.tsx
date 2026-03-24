import { useStore } from "../store/useStore";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Clock, User } from "lucide-react";
import { cn } from "../lib/utils";

export default function Tickets() {
  const tickets = useStore((state) => state.tickets);
  const feedbacks = useStore((state) => state.feedbacks);
  const businesses = useStore((state) => state.businesses);
  const updateTicket = useStore((state) => state.updateTicket);
  const userProfile = useStore((state) => state.userProfile);
  const isProfileLoaded = useStore((state) => state.isProfileLoaded);

  const business = businesses[0];

  if (!isProfileLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (isProfileLoaded && !userProfile?.businessId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Setup Required</h2>
          <p className="text-slate-600 mb-8">
            We couldn't find a business associated with your account.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 transition-colors duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Issue Tickets</h1>
        <p className="text-slate-500 mt-1">
          Auto-generated tickets from negative feedback
        </p>
      </header>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 transition-colors">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
            <p className="text-slate-500">No open issues at the moment.</p>
          </div>
        ) : (
          tickets.map((ticket, index) => {
            const feedback = feedbacks.find((f) => f.id === ticket.feedbackId);
            if (!feedback) return null;

            const staff = business?.staff?.find((s) => s.id === feedback.staffId);
            const assignedStaff = business?.staff?.find((s) => s.id === ticket.assignedTo);

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border p-6 transition-colors",
                  ticket.status === "resolved" 
                    ? "border-green-200 bg-green-50/30" 
                    : "border-red-200"
                )}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {ticket.status === "resolved" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5" /> Action Required
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-800 font-medium mb-4">
                      "{feedback.transcript}"
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {feedback.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-slate-400">Related to:</span>
                        {staff ? (
                          <div className="flex items-center gap-1.5">
                            <img src={staff.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                            <span className="font-medium text-slate-900">{staff.name}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-900">General</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div className="w-full">
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">
                        Assign To
                      </label>
                      <select
                        value={ticket.assignedTo || ""}
                        onChange={(e) => updateTicket(ticket.id, { assignedTo: e.target.value })}
                        disabled={ticket.status === "resolved"}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 transition-colors"
                      >
                        <option value="">Unassigned</option>
                        {business?.staff?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    {ticket.status !== "resolved" ? (
                      <button
                        onClick={() => updateTicket(ticket.id, { status: "resolved" })}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                        Mark as Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => updateTicket(ticket.id, { status: "open" })}
                        className="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        Reopen Ticket
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
