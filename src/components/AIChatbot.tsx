import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bot, User, Loader2, CornerDownLeft } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import Markdown from "react-markdown";
import { cn } from "../lib/utils";
import { useStore } from "../store/useStore";
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

const SYSTEM_PROMPT = `You are EchoTap's AI Business Strategy Advisor. You have access to real-time customer feedback and business data.

Your primary goal is to provide simple, actionable insights to the business owner.

RULES:
1. BE CONCISE: Never use long paragraphs. Use bullet points and short sentences.
2. USE DATA: You will be provided with current feedback and ticket data. Use it to answer questions about "today's feedback", "what's good/bad", etc.
3. TONE: Professional, supportive, and direct.
4. LANGUAGE: If the feedback is in Hindi/Hinglish, you can respond in a mix of English and Hindi (Hinglish) to feel more natural to the local business owner.

When asked about "today's feedback" or "how is it going":
- Summarize the sentiment.
- List 2-3 "Good" points (Praises).
- List 2-3 "Bad" points (Issues/Tickets).
- Give 1 simple suggestion.`;

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const feedbacks = useStore((state) => state.feedbacks);
  const tickets = useStore((state) => state.tickets);
  const businesses = useStore((state) => state.businesses);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello! I'm your EchoTap Advisor. I have access to your real-time feedback. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  // Prepare context data
  const dataContext = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayFeedbacks = feedbacks.filter(f => new Date(f.createdAt).setHours(0, 0, 0, 0) === today);
    const openTickets = tickets.filter(t => t.status !== "resolved");
    
    return {
      businessName: businesses[0]?.name || "Local Business",
      todayFeedbackCount: todayFeedbacks.length,
      todayFeedbacks: todayFeedbacks.map(f => ({
        sentiment: f.sentiment,
        text: f.transcript,
        tags: f.tags
      })),
      openTicketsCount: openTickets.length,
      allFeedbacksSummary: feedbacks.slice(0, 10).map(f => ({
        sentiment: f.sentiment,
        text: f.transcript
      }))
    };
  }, [feedbacks, tickets, businesses]);

  useEffect(() => {
    // Initialize Gemini Chat Session
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in environment variables.");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
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
      const contextString = `[CURRENT DATA CONTEXT]
Business: ${dataContext.businessName}
Today's Feedbacks: ${dataContext.todayFeedbackCount}
Open Tickets: ${dataContext.openTicketsCount}
Recent Feedback Details: ${JSON.stringify(dataContext.todayFeedbacks)}
[END CONTEXT]

User Question: ${userMsgText}`;

      const responseStream = await chatSessionRef.current.sendMessageStream({
        message: contextString,
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

          {isLoading && (messages[messages.length - 1]?.role !== "model" || messages[messages.length - 1]?.text === "") && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                fallback="AI"
              />
              <ChatBubbleMessage>
                <div className="flex items-center gap-2 text-slate-500 text-sm italic">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Advisor is thinking...
                </div>
              </ChatBubbleMessage>
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form
          onSubmit={handleSend}
          className="relative rounded-lg border bg-white border-slate-200 focus-within:ring-1 focus-within:ring-blue-500 p-1"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for business advice..."
            className="min-h-12 resize-none rounded-lg bg-white border-0 p-3 shadow-none focus-visible:ring-0 text-slate-900"
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              {/* Add attachments or mic here if needed */}
            </div>
            <Button type="submit" size="sm" className="ml-auto gap-1.5" disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  Send
                  <CornerDownLeft className="size-3.5" />
                </>
              )}
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
