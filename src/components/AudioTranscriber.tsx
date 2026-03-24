import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Square, Loader2, Copy, Check, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { analyzeAudio } from "../services/geminiService";

export function AudioTranscriber() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      const result = await analyzeAudio(base64, blob.type || "audio/webm");
      setTranscript(result.transcript || "No transcription available.");
    } catch (err) {
      console.error("Transcription error:", err);
      setTranscript("Error transcribing audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result.split(",")[1]);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setTranscript("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Mic className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Audio Transcriber</h2>
            <p className="text-sm text-slate-500">Convert voice to text instantly</p>
          </div>
        </div>
        
        {transcript && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Copy transcript"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClear}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0.2 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 bg-red-500 rounded-full"
              />
            )}
          </AnimatePresence>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className={cn(
              "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
              isRecording 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-blue-600 hover:bg-blue-700",
              isTranscribing && "opacity-50 cursor-not-allowed"
            )}
          >
            {isTranscribing ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : isRecording ? (
              <Square className="w-8 h-8 text-white fill-current" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        <div className="text-center">
          {isRecording ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-red-600 font-mono font-bold animate-pulse">RECORDING</span>
              <span className="text-slate-500 font-mono">{formatTime(duration)}</span>
            </div>
          ) : isTranscribing ? (
            <span className="text-blue-600 font-medium animate-pulse">Transcribing with AI...</span>
          ) : (
            <span className="text-slate-500 text-sm">Click the mic to start transcribing</span>
          )}
        </div>

        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100"
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transcript</h3>
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
              {transcript}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
