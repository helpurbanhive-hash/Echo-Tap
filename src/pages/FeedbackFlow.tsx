import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AIVoiceInput } from "../components/ui/ai-voice-input";
import { CheckCircle, AlertCircle, Loader2, Mic } from "lucide-react";
import { useStore } from "../store/useStore";
import { analyzeAudio } from "../services/geminiService";
import { Logo } from "../components/Logo";

type Step =
  | "welcome"
  | "recording"
  | "uploading"
  | "success"
  | "error"
  | "permission-blocked";

export default function FeedbackFlow() {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get("staffId") || undefined;
  const source = searchParams.get("source") || "link";
  const orderId = searchParams.get("order_id") || undefined;
  const userId = searchParams.get("user_id") || undefined;
  const qrId = searchParams.get("qr_id") || undefined;

  const [step, setStep] = useState<Step>("welcome");
  const [timeLeft, setTimeLeft] = useState(5);
  const [errorMessage, setErrorMessage] = useState("");
  const [audioBlobState, setAudioBlobState] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addFeedback = useStore((state) => state.addFeedback);
  const getBusiness = useStore((state) => state.getBusiness);

  const business = businessId ? getBusiness(businessId) : undefined;
  const promptText = business?.customPrompt || "Bas 5 seconds mein batao – service kaisi thi 🙂";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStartRecording = async () => {
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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlobState(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        await handleUpload(audioBlob);
      };

      mediaRecorder.start();

      // Removed hardcoded 10s limit, AIVoiceInput handles duration now
    } catch (err) {
      console.error("Mic permission error:", err);
      setStep("permission-blocked");
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      // We don't want to upload if cancelled
      audioChunksRef.current = [];
    }
    setStep("welcome");
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          // Extract base64 part
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleUpload = async (audioBlob: Blob, retryCount = 0) => {
    if (audioChunksRef.current.length === 0) return; // Cancelled

    if (!navigator.onLine) {
      setErrorMessage("Internet connection weak. Upload ho raha tha, fir try karein.");
      setStep("error");
      return;
    }

    setStep("uploading");

    try {
      let base64Audio: string;
      try {
        base64Audio = await blobToBase64(audioBlob);
      } catch (err) {
        throw new Error("Failed to read audio data. Please try recording again.");
      }

      const mimeType = audioBlob.type || "audio/webm";

      let analysis;
      try {
        analysis = await analyzeAudio(base64Audio, mimeType);
      } catch (err: any) {
        console.error("Analysis error:", err);
        const errorMsg = err.message || "";
        if (errorMsg.includes("API key") || errorMsg.includes("key not valid")) {
          throw new Error("AI service is not configured properly (Missing or invalid API Key).");
        } else if (errorMsg.includes("network") || errorMsg.includes("fetch") || errorMsg.includes("Failed to fetch")) {
          if (retryCount < 2) {
            // Auto retry up to 2 times
            setTimeout(() => handleUpload(audioBlob, retryCount + 1), 2000);
            return;
          }
          throw new Error("Network error. Upload ho raha tha, fir try karein.");
        } else if (errorMsg.includes("quota") || errorMsg.includes("429")) {
          throw new Error("AI service quota exceeded. Please try again later.");
        } else {
          throw new Error("Failed to analyze audio. The recording might be unclear or too short.");
        }
      }

      try {
        // Store locally (mocking DB)
        const audioUrl = URL.createObjectURL(audioBlob);

        addFeedback({
          id: Math.random().toString(36).substring(7),
          businessId: businessId || "b1",
          staffId,
          transcript: analysis.transcript,
          sentiment: analysis.sentiment,
          tags: analysis.tags,
          audioUrl,
          createdAt: Date.now(),
          metadata: {
            source,
            orderId,
            userId,
            qrId
          }
        });
      } catch (err) {
        throw new Error("Failed to save your feedback. Please try again.");
      }

      setStep("success");

      // Auto-return to welcome
      setTimeout(() => {
        setStep("welcome");
        setAudioBlobState(null);
      }, 4000);
    } catch (error: any) {
      console.error("Upload/Analysis error:", error);
      setErrorMessage(error.message || "An unexpected error occurred. Please try again.");
      setStep("error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            <div className="mb-8">
              <Logo className="w-24 h-24" variant="light" />
            </div>
            <AIVoiceInput 
              onStart={handleStartRecording}
              onStop={() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                  mediaRecorderRef.current.stop();
                }
              }}
            />
            <h1 className="mt-8 text-2xl font-semibold text-slate-800">
              {promptText}
            </h1>
            <div className="mt-auto pt-12 text-sm text-slate-400">
              Echo Mic Tap by {businessId === "b1" ? "Urban Glow Salon" : "Business"}
            </div>
          </motion.div>
        )}

        {step === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center"
          >
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
            <h2 className="text-xl font-semibold text-slate-800">
              Uploading your voice review...
            </h2>
            <p className="mt-2 text-slate-500">Processing with AI...</p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-slate-800">
              Shukriya! Aapka feedback mil gaya.
            </h2>
            <div className="mt-12 w-full max-w-xs h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center"
          >
            <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Oops! Something went wrong.
            </h2>
            <p className="text-slate-500 mb-8">{errorMessage}</p>
            <div className="flex gap-4">
              {audioBlobState && errorMessage.includes("Upload ho raha tha") ? (
                <button
                  onClick={() => handleUpload(audioBlobState)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                >
                  Retry Upload
                </button>
              ) : (
                <button
                  onClick={() => setStep("welcome")}
                  className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                >
                  Try Again
                </button>
              )}
            </div>
          </motion.div>
        )}

        {step === "permission-blocked" && (
          <motion.div
            key="permission"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Mic className="w-12 h-12 text-slate-400 line-through" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Microphone allow kijiye taki aap voice feedback de sakein.
            </h2>
            <p className="text-slate-500 mb-8">
              Please enable microphone access in your browser settings to
              continue.
            </p>
            <button
              onClick={() => setStep("welcome")}
              className="px-8 py-3 bg-slate-800 text-white rounded-full font-medium hover:bg-slate-900 transition-colors shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
            >
              I've enabled it
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
