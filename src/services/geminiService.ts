import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface AnalysisResult {
  transcript: string;
  sentiment: "positive" | "neutral" | "negative";
  tags: string[];
}

export async function analyzeAudio(
  base64Audio: string,
  mimeType: string,
): Promise<AnalysisResult> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: `You are an AI assistant analyzing customer feedback audio for an Indian local business.
The audio might be in Hindi, English, Hinglish, Marathi, Tamil, etc.

Perform the following tasks:
1. Transcribe the audio into text (keep the original language or translate to English/Hinglish if easier, but try to capture the exact meaning).
2. Determine the sentiment of the feedback: 'positive', 'neutral', or 'negative'.
3. Extract 1 to 3 short keyword tags representing the main issues or praises (e.g., 'Delay', 'Pricing', 'Behaviour', 'Cleanliness', 'Quality', 'Speed').

Return the result strictly as a JSON object matching this schema.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: {
              type: Type.STRING,
              description: "The transcribed text of the audio feedback.",
            },
            sentiment: {
              type: Type.STRING,
              description:
                "The sentiment: 'positive', 'neutral', or 'negative'.",
            },
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "List of 1 to 3 keyword tags.",
            },
          },
          required: ["transcript", "sentiment", "tags"],
        },
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    const result = JSON.parse(jsonStr) as AnalysisResult;

    // Normalize sentiment
    if (!["positive", "neutral", "negative"].includes(result.sentiment)) {
      result.sentiment = "neutral";
    }

    return result;
  } catch (error) {
    console.error("Error analyzing audio with Gemini:", error);
    throw error;
  }
}
