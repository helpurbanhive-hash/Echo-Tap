import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AIVoiceInput } from "../components/ui/ai-voice-input";
import { CheckCircle, AlertCircle, Loader2, Mic, Gift } from "lucide-react";
import { useStore } from "../store/useStore";
import { analyzeAudio } from "../services/geminiService";
import { Logo } from "../components/Logo";
import FeedbackSlider from "../components/ui/feedback-slider";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";

type Step =
  | "welcome"
  | "recording"
  | "uploading"
  | "received"
  | "rating"
  | "success"
  | "reward"
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
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [randomColor, setRandomColor] = useState("#000000");
  const [analysisResult, setAnalysisResult] = useState<{ tags: string[] } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const addFeedback = useStore((state) => state.addFeedback);
  const getBusiness = useStore((state) => state.getBusiness);
  const setBusinesses = useStore((state) => state.setBusinesses);

  const business = businessId ? getBusiness(businessId) : undefined;
  const promptText = business?.customPrompt || "Bas 5 seconds mein batao – service kaisi thi 🙂";

  // Random color cycle for the moving element
  useEffect(() => {
    const interval = setInterval(() => {
      const newColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      setRandomColor(newColor);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch business data if not in store (for customers)
  useEffect(() => {
    if (businessId && !business) {
      const fetchBusiness = async () => {
        try {
          const docRef = doc(db, "businesses", businessId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setBusinesses([{ id: docSnap.id, ...docSnap.data() } as any]);
          }
        } catch (error) {
          console.error("Error fetching business:", error);
        }
      };
      fetchBusiness();
    }
  }, [businessId, business, setBusinesses]);

  // Fetch customer feedback count
  useEffect(() => {
    if (businessId && userId) {
      const fetchCount = async () => {
        try {
          const q = query(
            collection(db, "feedback"),
            where("businessId", "==", businessId),
            where("metadata.userId", "==", userId)
          );
          const snapshot = await getDocs(q);
          setFeedbackCount(snapshot.size);
        } catch (error) {
          console.error("Error fetching feedback count:", error);
        }
      };
      fetchCount();
    }
  }, [businessId, userId]);

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
            handleStopRecording(prev);
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

  const handleStopRecording = (duration: number) => {
    setRecordingDuration(duration);
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
        setAnalysisResult(analysis);
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

        // Update local count
        setFeedbackCount(prev => prev + 1);

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

      // Show "Feedback received!" for 1.5 seconds
      setStep("received");
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Go to rating step
      setStep("rating");
    } catch (error: any) {
      console.error("Upload/Analysis error:", error);
      setErrorMessage(error.message || "An unexpected error occurred. Please try again.");
      setStep("error");
    }
  };

  const theme = business?.theme;
  const primaryColor = theme?.primaryColor || "#000000";
  const secondaryColor = theme?.secondaryColor || "#000000";
  const accentColor = theme?.accentColor || "#000000";

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-white px-4 transition-colors duration-300"
      style={{ 
        "--primary": primaryColor,
        "--secondary": secondaryColor,
        "--accent": accentColor
      } as React.CSSProperties}
    >
      {step === "recording" && (
        <div className="fixed top-0 left-0 w-full h-[1px] bg-black/5 z-50">
          <motion.div
            className="h-full bg-black/20"
            initial={{ width: "0%" }}
            animate={{ width: `${(recordingDuration / 60) * 100}%` }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </div>
      )}
      {/* Marquee Offers */}
      {step === "welcome" && business?.offers && business.offers.length > 0 && (
        <div className="fixed top-0 left-0 w-full overflow-hidden bg-black/[0.02] py-2 z-10">
          <motion.div 
            className="flex whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {[...business.offers, ...business.offers].map((offer, i) => (
              <span key={i} className="mx-8 text-[10px] uppercase tracking-[0.3em] font-bold text-black/20">
                🔥 {offer.title}: {offer.description} 🔥
              </span>
            ))}
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            <div className="mb-12 relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                {business?.logo ? (
                  <img 
                    src={business.logo} 
                    alt={business.name} 
                    className="w-24 h-24 object-contain drop-shadow-2xl" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Logo className="w-20 h-20" variant="light" />
                )}
              </motion.div>
              <div className="absolute -inset-4 bg-black/[0.02] rounded-full -z-10 blur-xl" />
            </div>
            
            <h1 
              className="mb-12 text-2xl font-medium leading-tight tracking-tight"
              style={{ color: primaryColor + "CC" }} // 80% opacity
            >
              {promptText}
            </h1>

            <div className="w-full mb-12">
              <AIVoiceInput 
                onStart={handleStartRecording}
                onStop={handleStopRecording}
              />
            </div>

            {/* Total Feedbacks (if loyalty disabled) */}
            {!business?.loyaltyConfig?.isEnabled && userId && (
              <div className="mb-12 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                Total Feedbacks: {feedbackCount}
              </div>
            )}

            {/* Loyalty Progress */}
            {business?.loyaltyConfig?.isEnabled && userId && (
              <div className="mb-12 w-full p-4 border border-black/5 rounded-2xl bg-black/[0.02]">
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-black/40 mb-2 font-medium">
                  <span>Loyalty Progress (Total: {feedbackCount})</span>
                  <span>{feedbackCount} / {business.loyaltyConfig.feedbackThreshold}</span>
                </div>
                <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-black/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((feedbackCount / business.loyaltyConfig.feedbackThreshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-12 text-[10px] uppercase tracking-[0.2em] text-black/30 font-medium">
              Echo Mic Tap • {business?.name || "Urban Glow Salon"}
            </div>
          </motion.div>
        )}

        {step === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center w-full max-w-md"
          >
            <div className="mb-12">
              <Logo className="w-12 h-12 grayscale opacity-50" variant="light" />
            </div>
            
            <div className="w-full">
               <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-8">
                    <div 
                      className="w-6 h-6 rounded-sm animate-spin" 
                      style={{ animationDuration: '3s', backgroundColor: randomColor }} 
                    />
                  </div>
                  <h2 className="text-xl font-medium mb-2" style={{ color: primaryColor + "CC" }}>Listening...</h2>
                  <p className="text-black/30 mb-12 text-sm">Boliye, hum sun rahe hain</p>
                  
                  <div className="flex items-end gap-0.5 h-8 mb-16">
                    {[...Array(32)].map((_, i) => (
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
                        className="w-0.5 rounded-full"
                        style={{ backgroundColor: primaryColor + "80" }} // 50% opacity
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleStopRecording(recordingDuration)}
                    className="px-12 py-4 border rounded-xl font-medium hover:bg-black/5 transition-all text-sm uppercase tracking-widest"
                    style={{ borderColor: primaryColor + "1A", color: primaryColor + "CC" }} // 10% opacity border
                  >
                    Stop Recording
                  </button>
               </div>
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
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-12">
              <div 
                className="w-6 h-6 rounded-sm animate-spin" 
                style={{ animationDuration: '2s', backgroundColor: randomColor }} 
              />
            </div>
            <h2 className="text-xl font-medium mb-2" style={{ color: primaryColor + "CC" }}>Analyzing...</h2>
            <p className="text-black/30 text-sm">Processing your feedback with AI</p>
          </motion.div>
        )}

        {step === "received" && (
          <motion.div
            key="received"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center text-center"
          >
            <div 
              className="w-16 h-16 rounded-xl border flex items-center justify-center mb-12"
              style={{ borderColor: primaryColor + "1A" }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: primaryColor + "CC" }} />
            </div>
            <h2 className="text-xl font-medium tracking-tight" style={{ color: primaryColor + "CC" }}>
              Feedback received!
            </h2>
            {analysisResult?.tags && analysisResult.tags.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex flex-wrap justify-center gap-2"
              >
                {analysisResult.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-medium"
                    style={{ backgroundColor: primaryColor + "0D", color: primaryColor + "99" }}
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {step === "rating" && (
          <motion.div
            key="rating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex items-center justify-center"
          >
            <FeedbackSlider 
              className="max-w-md h-[600px] shadow-2xl"
              onSelect={async () => {
                // Delay slightly then go to success or reward
                setTimeout(() => {
                  if (business?.loyaltyConfig?.isEnabled && feedbackCount >= business.loyaltyConfig.feedbackThreshold) {
                    setStep("reward");
                  } else {
                    setStep("success");
                  }
                  
                  // Auto-return to welcome
                  setTimeout(() => {
                    setStep("welcome");
                    setAudioBlobState(null);
                    setAnalysisResult(null);
                  }, 6000);
                }, 1000);
              }}
            />
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div 
              className="w-16 h-16 rounded-xl border flex items-center justify-center mb-12"
              style={{ borderColor: primaryColor + "1A" }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: primaryColor + "CC" }} />
            </div>
            <h2 className="text-xl font-medium tracking-tight" style={{ color: primaryColor + "CC" }}>
              Shukriya! Aapka feedback mil gaya.
            </h2>
            <div className="mt-24 w-32 h-[1px] bg-black/5 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: primaryColor + "33" }} // 20% opacity
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 6, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {step === "reward" && (
          <motion.div
            key="reward"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-12 shadow-2xl"
              style={{ backgroundColor: primaryColor, boxShadow: `0 25px 50px -12px ${primaryColor}33` }}
            >
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-medium mb-4 tracking-tight" style={{ color: primaryColor + "CC" }}>
              Congratulations!
            </h2>
            <p className="text-black/40 mb-12 text-sm leading-relaxed">
              Aapne {business?.loyaltyConfig?.feedbackThreshold} baar feedback diya hai! Aapko milta hai:
            </p>
            <div 
              className="w-full p-8 border-2 rounded-3xl mb-12"
              style={{ borderColor: primaryColor, backgroundColor: primaryColor + "05" }}
            >
              <div className="text-3xl font-bold uppercase tracking-tighter" style={{ color: primaryColor }}>
                {business?.loyaltyConfig?.discountValue || "Special Discount"}
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-widest text-black/30 font-medium">
                Show this screen at the counter
              </div>
            </div>
            <div className="w-32 h-[1px] bg-black/5 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: primaryColor + "33" }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 6, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-xl border border-black/10 flex items-center justify-center mb-12">
              <AlertCircle className="w-8 h-8 text-black/80" />
            </div>
            <h2 className="text-xl font-medium text-black/80 mb-4">Something went wrong</h2>
            <p className="text-black/30 mb-12 text-sm leading-relaxed">{errorMessage}</p>
            <button
              onClick={() => setStep("welcome")}
              className="px-12 py-4 border border-black/10 text-black/80 rounded-xl font-medium hover:bg-black/5 transition-all text-sm uppercase tracking-widest"
            >
              Try Again
            </button>
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
