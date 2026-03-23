import { motion } from "motion/react";
import { Mic } from "lucide-react";
import { cn } from "../lib/utils";

interface MicButtonProps {
  onStart: () => void;
  isRecording: boolean;
  disabled?: boolean;
}

export function MicButton({ onStart, isRecording, disabled }: MicButtonProps) {
  return (
    <motion.button
      onClick={onStart}
      disabled={disabled || isRecording}
      whileTap={!disabled && !isRecording ? { scale: 0.94 } : {}}
      transition={{ duration: 0.09, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative flex items-center justify-center w-48 h-48 rounded-full",
        "bg-blue-600 text-white shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition-all",
        !disabled && !isRecording && "hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg",
        disabled && "opacity-40 cursor-not-allowed",
        isRecording && "bg-red-500",
      )}
      aria-label="Tap to Record"
      role="button"
    >
      {isRecording && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-red-400"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <Mic className="w-20 h-20" strokeWidth={2.5} />
    </motion.button>
  );
}
