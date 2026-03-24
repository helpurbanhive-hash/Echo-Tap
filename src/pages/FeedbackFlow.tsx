import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AIVoiceInput } from "../components/ui/ai-voice-input";
import { CheckCircle, AlertCircle, Loader2, Mic } from "lucide-react";
import { useStore } from "../store/useStore";
import { analyzeAudio } from "../services/geminiService";
import { Logo } from "../components/Logo";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";

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
  const [mounted, setMounted] = useState(false);
  
  const staffId = searchParams.get("staffId") || undefined;
  const source = searchParams.get("source") || "link";
  const orderId = searchParams.get("order_id") || undefined;
  const userId = searchParams.get("user_id") || undefined;
  const qrId = searchParams.get("qr_id") || undefined;

  const [step, setStep] = useState<Step>("welcome");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [audioBlobState, setAudioBlobState] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const addFeedback = useStore((state) => state.addFeedback);
  const getBusiness = useStore((state) => state.getBusiness);

  const business = businessId ? getBusiness(businessId) : undefined;
  const promptText = business?.customPrompt || "Bas 5 seconds mein batao – service kaisi thi 🙂";

  // Cleanup on unmount
  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
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
      setStep("recording");
      setRecordingDuration(0);

      // Setup Audio Context for visualization
      const audioContext = new AudioContext();
      const sourceNode = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      sourceNode.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(average / 128); // Normalize to 0-1 approx
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

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
        if (audioContextRef.current) audioContextRef.current.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        await handleUpload(audioBlob);
      };

      mediaRecorder.start();

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) { // Max 60 seconds
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Mic permission error:", err);
      setStep("permission-blocked");
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
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
        // Store in Firestore
        const feedbackData = {
          businessId: businessId || "b1",
          staffId: staffId || null,
          content: analysis.transcript,
          type: "voice",
          sentiment: analysis.sentiment,
          tags: analysis.tags,
          createdAt: serverTimestamp(),
          metadata: {
            source,
            orderId: orderId || null,
            userId: userId || null,
            qrId: qrId || null
          }
        };

        const feedbackRef = collection(db, "feedback");
        await addDoc(feedbackRef, feedbackData);

        // Also update local store for immediate UI feedback if needed
        const audioUrl = URL.createObjectURL(audioBlob);
        addFeedback({
          id: Math.random().toString(36).substring(7),
          ...feedbackData,
          transcript: analysis.transcript,
          audioUrl,
          createdAt: Date.now(),
          metadata: {
            source,
            orderId,
            userId,
            qrId
          }
        } as any);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "feedback");
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 transition-colors duration-300">
      {step === "recording" && (
        <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-100 z-50">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: "0%" }}
            animate={{ width: `${(recordingDuration / 60) * 100}%` }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </div>
      )}
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
            />
            <h1 className="mt-8 text-2xl font-semibold text-slate-800">
              {promptText}
            </h1>
            <div className="mt-auto pt-12 text-sm text-slate-400">
              Echo Mic Tap by {businessId === "b1" ? "Urban Glow Salon" : "Business"}
            </div>
          </motion.div>
        )}

        {step === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center text-center w-full max-w-md"
          >
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
              {/* Animated Waveform Rings based on real audio level */}
              <motion.div
                animate={{ 
                  scale: [1, 1 + audioLevel * 0.5, 1], 
                  opacity: [0.3, 0.1 + audioLevel * 0.2, 0.3] 
                }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 rounded-full bg-blue-500/20"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1 + audioLevel * 0.3, 1], 
                  opacity: [0.4, 0.2 + audioLevel * 0.2, 0.4] 
                }}
                transition={{ duration: 0.15, delay: 0.05 }}
                className="absolute inset-4 rounded-full bg-blue-500/30"
              />
              
              {/* Progress Ring */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 88}
                  animate={{ strokeDashoffset: (2 * Math.PI * 88) * (1 - recordingDuration / 60) }}
                  className="text-blue-600"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-3xl font-mono font-bold text-slate-900">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </div>
                {/* Mini Bar Visualizer inside the ring */}
                <div className="flex items-end gap-0.5 h-8 mt-2">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: [
                          "20%", 
                          `${20 + Math.random() * audioLevel * 80}%`, 
                          "20%"
                        ] 
                      }}
                      transition={{ 
                        duration: 0.1, 
                        repeat: Infinity,
                        delay: i * 0.02
                      }}
                      className="w-1 bg-blue-500 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-slate-800 mb-2">Recording...</h2>
            <p className="text-slate-500 mb-12">Boliye, hum sun rahe hain</p>

            <button
              onClick={handleStopRecording}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors group"
            >
              <div className="w-6 h-6 bg-white rounded-sm group-hover:scale-110 transition-transform" />
            </button>
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
