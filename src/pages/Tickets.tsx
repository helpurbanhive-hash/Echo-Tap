import { useStore } from "../store/useStore";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Clock, User } from "lucide-react";
import { cn } from "../lib/utils";

export default function Tickets() {
  const tickets = useStore((state) => state.tickets);
  const feedbacks = useStore((state) => state.feedbacks);
  const businesses = useStore((state) => state.businesses);
  const updateTicket = useStore((state) => state.updateTicket);

  const business = businesses[0];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-950 p-8 transition-colors duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-50">Issue Tickets</h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-1">
          Auto-generated tickets from negative feedback
        </p>
      </header>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 transition-colors">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-zinc-50">All caught up!</h3>
            <p className="text-slate-500 dark:text-zinc-400">No open issues at the moment.</p>
          </div>
        ) : (
          tickets.map((ticket, index) => {
            const feedback = feedbacks.find((f) => f.id === ticket.feedbackId);
            if (!feedback) return null;

            const staff = business.staff.find((s) => s.id === feedback.staffId);
            const assignedStaff = business.staff.find((s) => s.id === ticket.assignedTo);

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border p-6 transition-colors",
                  ticket.status === "resolved" 
                    ? "border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10" 
                    : "border-red-200 dark:border-red-900/30"
                )}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {ticket.status === "resolved" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-xs font-bold uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5" /> Action Required
                        </span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-800 dark:text-zinc-200 font-medium mb-4">
                      "{feedback.transcript}"
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {feedback.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-md text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                        <span className="text-slate-400 dark:text-zinc-500">Related to:</span>
                        {staff ? (
                          <div className="flex items-center gap-1.5">
                            <img src={staff.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                            <span className="font-medium text-slate-900 dark:text-zinc-50">{staff.name}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-900 dark:text-zinc-50">General</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800 pt-4 md:pt-0 md:pl-6">
                    <div className="w-full">
                      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                        Assign To
                      </label>
                      <select
                        value={ticket.assignedTo || ""}
                        onChange={(e) => updateTicket(ticket.id, { assignedTo: e.target.value })}
                        disabled={ticket.status === "resolved"}
                        className="w-full text-sm border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 transition-colors"
                      >
                        <option value="">Unassigned</option>
                        {business.staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    {ticket.status !== "resolved" ? (
                      <button
                        onClick={() => updateTicket(ticket.id, { status: "resolved" })}
                        className="w-full py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
                      >
                        Mark as Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => updateTicket(ticket.id, { status: "open" })}
                        className="w-full py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
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
