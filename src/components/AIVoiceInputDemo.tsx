import { AIVoiceInput } from "./ui/ai-voice-input";
import { useState } from "react";

export function AIVoiceInputDemo() {
  const [recordings, setRecordings] = useState<{ duration: number; timestamp: Date }[]>([]);

  const handleStop = (duration: number) => {
    setRecordings(prev => [...prev.slice(-4), { duration, timestamp: new Date() }]);
  };

  return (
    <div className="space-y-12 p-12 max-w-md mx-auto">
        <div className="space-y-8">
          <h2 className="text-xs uppercase tracking-[0.2em] text-black/30 font-medium">Voice Input Demo</h2>
          <AIVoiceInput 
            onStart={() => console.log('Recording started')}
            onStop={handleStop}
          />   
          
          <div className="pt-12 border-t border-black/5">
            <h3 className="text-[10px] uppercase tracking-widest text-black/20 font-medium mb-6">Recent Recordings</h3>
            <div className="space-y-4">
              {recordings.map((rec, i) => (
                <div key={i} className="flex justify-between items-center group">
                  <span className="text-sm font-medium text-black/60">{rec.duration}s</span>
                  <span className="text-[10px] text-black/20 uppercase tracking-tighter">{rec.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
              {recordings.length === 0 && (
                <p className="text-xs text-black/20 italic">No recordings yet</p>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
