import { useStore } from "../store/useStore";
import { motion } from "motion/react";
import {
  Smile,
  Meh,
  Frown,
  Play,
  Pause,
  Calendar,
  Tag,
  User,
  QrCode,
  Smartphone,
  Link as LinkIcon,
  Hash,
  AlertCircle,
  Users,
  Settings,
  Zap,
  Mic,
  TrendingUp
} from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "../lib/utils";
import { PullToRefresh } from "../components/PullToRefresh";
import { AIChatbot } from "../components/AIChatbot";
import DisplayCards from "../components/ui/display-cards";
import { SocialLinks } from "../components/ui/social-links";
import { TestimonialsSection } from "../components/ui/testimonials-with-marquee";
import { TextEffect } from "../components/ui/text-effect";
import { ShaderAnimation } from "../components/ui/shader-animation";

const testimonials = [
  {
    author: {
      name: "Emma Thompson",
      handle: "@emmaai",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
    },
    text: "Using this AI platform has transformed how we handle data analysis. The speed and accuracy are unprecedented.",
    href: "https://twitter.com/emmaai"
  },
  {
    author: {
      name: "David Park",
      handle: "@davidtech",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    text: "The API integration is flawless. We've reduced our development time by 60% since implementing this solution.",
    href: "https://twitter.com/davidtech"
  },
  {
    author: {
      name: "Sofia Rodriguez",
      handle: "@sofiaml",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    text: "Finally, an AI tool that actually understands context! The accuracy in natural language processing is impressive."
  }
];

const socials = [
  {
    name: "Instagram",
    image: "https://link-hover-lndev.vercel.app/instagram.png",
  },
  {
    name: "LinkedIn",
    image: "https://link-hover-lndev.vercel.app/linkedin.png",
  },
  {
    name: "Spotify",
    image: "https://link-hover-lndev.vercel.app/spotify.png",
  },
  {
    name: "TikTok",
    image: "https://link-hover-lndev.vercel.app/tiktok.png",
  },
];

const dashboardCards = [
  {
    icon: <Zap className="size-4 text-amber-500" />,
    title: "Instant AI Analysis",
    description: "Real-time sentiment & insights",
    date: "Benefit 1",
    iconClassName: "text-amber-500",
    titleClassName: "text-amber-500",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Mic className="size-4 text-blue-600" />,
    title: "Effortless Voice Input",
    description: "Customers speak naturally",
    date: "Benefit 2",
    iconClassName: "text-blue-600",
    titleClassName: "text-blue-600",
    className:
      "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <TrendingUp className="size-4 text-emerald-600" />,
    title: "Data-Driven Decisions",
    description: "Track trends & performance",
    date: "Benefit 3",
    iconClassName: "text-emerald-600",
    titleClassName: "text-emerald-600",
    className:
      "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
  },
];

export default function Dashboard() {
  const feedbacks = useStore((state) => state.feedbacks);
  const businesses = useStore((state) => state.businesses);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const business = businesses[0]; // Default business for MVP

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const todayFeedbacks = feedbacks.filter(
    (f) => new Date(f.createdAt).toDateString() === new Date().toDateString(),
  );

  const positiveCount = feedbacks.filter(
    (f) => f.sentiment === "positive",
  ).length;
  const neutralCount = feedbacks.filter(
    (f) => f.sentiment === "neutral",
  ).length;
  const negativeCount = feedbacks.filter(
    (f) => f.sentiment === "negative",
  ).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      {/* Hero Section with Shader Animation */}
      <div className="relative h-[300px] w-full flex flex-col items-center justify-center overflow-hidden bg-slate-900 mb-8">
        <div className="absolute inset-0 opacity-50">
          <ShaderAnimation />
        </div>
        <div className="relative z-10 text-center px-4">
          <TextEffect as="h2" className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4" preset="blur">
            Echo Mic Tap
          </TextEffect>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Transforming customer feedback into actionable insights with the power of AI and Voice.
          </p>
        </div>
      </div>

      <div className="px-8 pb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <TextEffect as="h1" className="text-3xl font-bold text-slate-900" preset="blur">
              Dashboard
            </TextEffect>
            <p className="text-slate-500 mt-1">Welcome back, {business.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
              <Calendar className="w-4 h-4" />
              Today
            </button>
          </div>
        </header>

      {/* Featured Areas */}
      <div className="mb-12 flex justify-center">
        <DisplayCards cards={dashboardCards} />
      </div>

      {/* Summary Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200"
        >
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Today's Feedback
          </h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-mono font-bold text-slate-900">
              {todayFeedbacks.length}
            </span>
            <span className="text-sm font-medium text-green-500 mb-1">
              +12% vs yesterday
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 col-span-2"
        >
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Sentiment Summary
          </h3>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Smile className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  {positiveCount}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Positive
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Meh className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  {neutralCount}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Neutral
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Frown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  {negativeCount}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Negative
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Heatmap Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 p-6 mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Feedback Heatmap (Last 7 Days)
          </h3>
          <div className="flex gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-slate-100"></div> Low</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-300"></div> Medium</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-600"></div> High</div>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
            <div key={day} className="flex-1 min-w-[40px]">
              <div className="text-xs text-slate-400 text-center mb-2">{day}</div>
              <div className="space-y-1">
                {/* Mock heatmap data blocks */}
                {[...Array(6)].map((_, j) => {
                  const intensity = Math.random();
                  const bgClass = intensity > 0.7 ? "bg-blue-600" : intensity > 0.3 ? "bg-blue-300" : "bg-slate-100";
                  return (
                    <div 
                      key={j} 
                      className={`h-8 rounded-md ${bgClass} transition-colors hover:ring-2 hover:ring-blue-400 cursor-pointer`}
                      title={`${day} ${8 + j * 2}:00 - ${intensity > 0.5 ? 'High' : 'Low'} Volume`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feedback List */}
      <div className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">
            Latest Feedback
          </h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
              All
            </span>
            <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors">
              Needs Attention
            </span>
          </div>
        </div>

        <div className="h-[500px] relative">
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="divide-y divide-slate-100">
              {feedbacks.map((feedback, index) => (
                <FeedbackRow
                  key={feedback.id}
                  feedback={feedback}
                  index={index}
                  business={business}
                />
              ))}
              {feedbacks.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No feedback received yet.
                </div>
              )}
            </div>
          </PullToRefresh>
        </div>
      </div>

      {/* Testimonials */}
      <TestimonialsSection
        title="Trusted by businesses worldwide"
        description="Join hundreds of businesses who are already improving their customer experience with Echo Mic Tap"
        testimonials={testimonials}
        className="bg-transparent py-16"
      />

      {/* Footer */}
      <footer className="mt-12 py-12 border-t border-slate-200 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">
            Connect with us
          </div>
          <SocialLinks socials={socials} />
          <div className="text-slate-400 text-xs mt-4">
            © 2026 Echo Mic Tap. All rights reserved.
          </div>
        </div>
      </footer>

      </div>

      <AIChatbot />
    </div>
  );
}

function FeedbackRow({
  feedback,
  index,
  business,
}: {
  key?: string | number;
  feedback: any;
  index: number;
  business: any;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const staff = business.staff.find((s: any) => s.id === feedback.staffId);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      if (total > 0) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors group"
    >
      {/* Sentiment Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          feedback.sentiment === "positive" && "bg-green-100 text-green-600",
          feedback.sentiment === "neutral" && "bg-orange-100 text-orange-600",
          feedback.sentiment === "negative" && "bg-red-100 text-red-600",
        )}
      >
        {feedback.sentiment === "positive" && <Smile className="w-5 h-5" />}
        {feedback.sentiment === "neutral" && <Meh className="w-5 h-5" />}
        {feedback.sentiment === "negative" && <Frown className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {staff && (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
                <img
                  src={staff.avatarUrl}
                  alt={staff.name}
                  className="w-4 h-4 rounded-full"
                />
                {staff.name}
              </div>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {new Date(feedback.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
              View Details
            </button>
          </div>
        </div>

        <p className="text-slate-800 font-medium text-sm leading-relaxed mb-3">
          "{feedback.transcript}"
        </p>

        {feedback.metadata && (
          <div className="flex flex-wrap gap-3 mb-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            {feedback.metadata.source === 'qr' && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                <span>QR Scan</span>
              </div>
            )}
            {feedback.metadata.source === 'wa' && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                <Smartphone className="w-3.5 h-3.5 text-green-500" />
                <span>WhatsApp</span>
              </div>
            )}
            {feedback.metadata.source === 'link' && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
                <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Direct Link</span>
              </div>
            )}
            {feedback.metadata.orderId && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border-l border-slate-200 pl-3">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Order: {feedback.metadata.orderId}</span>
              </div>
            )}
            {feedback.metadata.userId && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border-l border-slate-200 pl-3">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>User: {feedback.metadata.userId}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {feedback.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          {feedback.audioUrl && (
            <div className="flex items-center gap-3 bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200">
              <button
                onClick={togglePlay}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3 ml-0.5" />
                )}
              </button>
              <div 
                className="flex gap-0.5 h-4 items-center cursor-pointer"
                onClick={togglePlay}
              >
                {[...Array(20)].map((_, i) => {
                  const isActive = (i / 20) * 100 <= progress;
                  return (
                    <motion.div
                      key={i}
                      className={cn(
                        "w-1 rounded-full",
                        isActive ? "bg-blue-600" : "bg-blue-200"
                      )}
                      animate={
                        isPlaying
                          ? { height: ["4px", "16px", "4px"] }
                          : { height: "4px" }
                      }
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.05,
                      }}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] font-medium text-slate-500 w-8 text-right">
                {isPlaying ? formatTime(currentTime) : formatTime(duration)}
              </span>
              <audio
                ref={audioRef}
                src={feedback.audioUrl}
                onEnded={() => {
                  setIsPlaying(false);
                  setProgress(0);
                  setCurrentTime(0);
                }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
