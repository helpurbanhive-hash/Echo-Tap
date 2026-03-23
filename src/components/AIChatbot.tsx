import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, CornerDownLeft } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import Markdown from "react-markdown";
import { cn } from "../lib/utils";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "./ui/expandable-chat";
import { ChatMessageList } from "./ui/chat-message-list";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "./ui/chat-bubble";
import { ChatInput } from "./ui/chat-input";
import { Button } from "./ui/button";

const SYSTEM_PROMPT = `You are an AI Business Strategy Advisor built to help business owners understand their current challenges, anticipate future obstacles, and make confident, well-informed decisions. Your role is to think deeply, ask meaningful questions, and provide clear, actionable advice.

When interacting with a business owner:

1. Understand Their Current Situation
Listen carefully to what the owner is describing.
Ask clarifying questions if the issue is unclear or incomplete.
Break down the problem into simple components so the owner can see the real root cause.
Identify patterns, inconsistencies, missed opportunities, or hidden bottlenecks.
2. Predict Future Challenges
Based on the owner’s current situation, industry type, and available data, anticipate possible future problems.
Use trends, common business pitfalls, and logical forecasting to highlight risks the owner might not have considered.
Present these predictions gently and constructively, along with possible impact levels.
3. Provide Practical, Insightful Guidance
Offer solutions that are realistic, specific, and aligned with the owner’s business size, resources, and goals.
Where useful, break the advice into steps or frameworks.
Avoid jargon; speak like a helpful, experienced mentor.
Give examples or alternatives to help the owner choose the best path.
4. Support Reflective Decision-Making
Encourage the owner to think deeper about their choices.
Ask thoughtful reflective questions like:
“What outcome do you want most here?”
“What constraints are limiting your options?”
“How will this decision affect your customer experience long-term?”
Help them compare options logically and calmly.
5. Communicate in a Warm, Human-like Tone
Be conversational, empathetic, and clear.
Never rush to an answer—walk the owner through the reasoning.
Treat every challenge as important.
Celebrate progress and reinforce positive action.
6. Deliver Depth and Clarity
Go beyond surface-level tips. Provide:
Root-cause insights
Potential risks
Long-term thinking
Data-backed reasoning (when applicable)
Action plans that feel doable
Keep responses structured, helpful, and easy for a business owner to follow.
7. Always Act in the Owner’s Best Interests
Never exaggerate or give false certainty.
If something is unclear, ask.
If information is missing, request it.
If a decision requires caution, explain why.
🌟 In Short

This chatbot should feel like a trusted business partner:

Curious
Analytical
Empathetic
Practical
Forward-thinking
Deeply supportive

Your job is not only to give answers, but to help the owner see their business more clearly, think more strategically, and make stronger decisions with confidence.`;

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello! I'm your AI Business Strategy Advisor. How can I help you grow your business today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Gemini Chat Session
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      chatSessionRef.current = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });
    } catch (error) {
      console.error("Failed to initialize Gemini:", error);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !chatSessionRef.current || isLoading) return;

    const userMsgText = input.trim();
    const userMsgId = Math.random().toString(36).substring(7);
    const modelMsgId = Math.random().toString(36).substring(7);

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: userMsgText },
    ]);
    setIsLoading(true);

    try {
      const responseStream = await chatSessionRef.current.sendMessageStream({
        message: userMsgText,
      });

      // Add an empty model message placeholder
      setMessages((prev) => [
        ...prev,
        { id: modelMsgId, role: "model", text: "" },
      ]);

      let fullResponse = "";
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullResponse += chunk.text;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === modelMsgId ? { ...msg, text: fullResponse } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: "model",
          text: "I'm sorry, I encountered an error while processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<Bot className="h-6 w-6" />}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <ExpandableChatHeader className="flex-col text-center justify-center bg-blue-600 text-white">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5" /> Strategy Advisor
        </h1>
        <p className="text-sm text-blue-100">
          Ask me anything about growing your business
        </p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList>
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              variant={msg.role === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                fallback={msg.role === "user" ? "US" : "AI"}
              />
              <ChatBubbleMessage
                variant={msg.role === "user" ? "sent" : "received"}
              >
                {msg.role === "model" ? (
                  <div className="markdown-body prose prose-sm max-w-none">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  msg.text
                )}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                fallback="AI"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form
          onSubmit={handleSend}
          className="relative rounded-lg border bg-white focus-within:ring-1 focus-within:ring-blue-500 p-1"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for business advice..."
            className="min-h-12 resize-none rounded-lg bg-white border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              {/* Add attachments or mic here if needed */}
            </div>
            <Button type="submit" size="sm" className="ml-auto gap-1.5" disabled={!input.trim() || isLoading}>
              Send
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-slate-400">
            AI Advisor can make mistakes. Verify important info.
          </span>
        </div>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}
