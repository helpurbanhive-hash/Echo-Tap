import { useStore } from "../store/useStore";
import { motion } from "motion/react";
import { Smile, Meh, Frown, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../lib/utils";

export default function StaffPerformance() {
  const businesses = useStore((state) => state.businesses);
  const feedbacks = useStore((state) => state.feedbacks);
  const userProfile = useStore((state) => state.userProfile);
  const isProfileLoaded = useStore((state) => state.isProfileLoaded);

  const business = businesses[0]; // Default business for MVP

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
            <TrendingUp className="w-8 h-8" />
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
          <p className="text-slate-500 font-medium">Loading performance data...</p>
        </div>
      </div>
    );
  }

  const staffStats = (business.staff || [])
    .map((staff) => {
      const staffFeedbacks = feedbacks.filter((f) => f.staffId === staff.id);
      const positive = staffFeedbacks.filter(
        (f) => f.sentiment === "positive",
      ).length;
      const neutral = staffFeedbacks.filter(
        (f) => f.sentiment === "neutral",
      ).length;
      const negative = staffFeedbacks.filter(
        (f) => f.sentiment === "negative",
      ).length;
      const total = staffFeedbacks.length;

      // Simple score calculation: positive = +1, neutral = 0, negative = -1
      const score = total > 0 ? ((positive - negative) / total) * 100 : 0;

      return {
        ...staff,
        stats: { positive, neutral, negative, total, score },
      };
    })
    .sort((a, b) => b.stats.score - a.stats.score);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 transition-colors duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Staff Performance</h1>
        <p className="text-slate-500 mt-1">
          Track service quality per employee
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffStats.map((staff, index) => (
          <motion.div
            key={staff.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 p-6 relative overflow-hidden group transition-colors"
          >
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                Top Performer
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <img
                src={staff.avatarUrl}
                alt={staff.name}
                className="w-16 h-16 rounded-full border-2 border-slate-100"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {staff.name}
                </h3>
                <div className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider">
                    {staff.role}
                  </span>
                  <span>•</span>
                  <span>{staff.stats.total} reviews</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-sm text-slate-500 font-medium mb-1">
                  Happiness Score
                </span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-mono font-bold text-slate-900">
                    {staff.stats.score > 0 ? "+" : ""}
                    {Math.round(staff.stats.score)}
                  </span>
                  {staff.stats.score >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500 mb-1" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500 mb-1" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Smile className="w-4 h-4 text-green-500" /> Positive
                </div>
                <span className="font-semibold text-slate-900">
                  {staff.stats.positive}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{
                    width: `${staff.stats.total ? (staff.stats.positive / staff.stats.total) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Meh className="w-4 h-4 text-orange-500" /> Neutral
                </div>
                <span className="font-semibold text-slate-900">
                  {staff.stats.neutral}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-orange-500 h-1.5 rounded-full"
                  style={{
                    width: `${staff.stats.total ? (staff.stats.neutral / staff.stats.total) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Frown className="w-4 h-4 text-red-500" /> Negative
                </div>
                <span className="font-semibold text-slate-900">
                  {staff.stats.negative}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
                  style={{
                    width: `${staff.stats.total ? (staff.stats.negative / staff.stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
