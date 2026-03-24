"use client";

import { Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
  maxDuration?: number; // Added maxDuration
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  className,
  maxDuration = 60 // Default 60 seconds
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(demoMode);
  const timeRef = useRef(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    timeRef.current = time;
    // Auto-stop if maxDuration reached
    if (submitted && time >= maxDuration) {
      setSubmitted(false);
    }
  }, [time, submitted, maxDuration]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (submitted) {
      onStart?.();
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      onStop?.(timeRef.current);
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [submitted]); // Removed time, onStart, onStop to prevent infinite loops

  useEffect(() => {
    if (!isDemo) return;

    let timeoutId: NodeJS.Timeout;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };

    const initialTimeout = setTimeout(runAnimation, 100);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isDemo, demoInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (isDemo) {
      setIsDemo(false);
      setSubmitted(false);
    } else {
      setSubmitted((prev) => !prev);
    }
  };

  const progress = (time / maxDuration) * 100;

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className={cn(
            "group w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative",
            submitted
              ? "bg-red-50 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              : "bg-white hover:bg-slate-50 shadow-sm border border-slate-200"
          )}
          type="button"
          onClick={handleClick}
        >
          {submitted && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-100"
              />
              <circle
                cx="40"
                cy="40"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={238.76}
                strokeDashoffset={238.76 - (238.76 * progress) / 100}
                className="text-red-500 transition-all duration-1000 ease-linear"
              />
            </svg>
          )}
          {submitted ? (
            <div
              className="w-6 h-6 rounded-sm bg-red-600 animate-pulse"
            />
          ) : (
            <Mic className="w-8 h-8 text-slate-600 group-hover:text-blue-600 transition-colors" />
          )}
        </button>

        <div className="flex flex-col items-center gap-1 mt-2">
          <span
            className={cn(
              "font-mono text-sm font-medium transition-opacity duration-300",
              submitted
                ? "text-red-600"
                : "text-slate-400"
            )}
          >
            {submitted ? "RECORDING" : "READY"} • {formatTime(time)} / {formatTime(maxDuration)}
          </span>
        </div>

        <div className="h-12 w-full max-w-xs flex items-center justify-center gap-1 mt-4">
          {[...Array(visualizerBars)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-300",
                submitted
                  ? "bg-red-400 animate-pulse"
                  : "bg-slate-200 h-1"
              )}
              style={
                submitted && isClient
                  ? {
                      height: `${30 + Math.random() * 70}%`,
                      animationDelay: `${i * 0.05}s`,
                      opacity: 0.3 + (Math.random() * 0.7)
                    }
                  : undefined
              }
            />
          ))}
        </div>

        <p className="h-4 text-xs text-black/70">
          {submitted ? "Listening..." : "Click to speak"}
        </p>
      </div>
    </div>
  );
}
