import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import MarkdownRenderer from "./MarkdownRenderer";
import { Send, Sparkles, AlertCircle, RefreshCw, Bot, User } from "lucide-react";

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: `Hello! I am your **PeptideStack AI Research Assistant**, powered by Gemini. 

I can assist you with molecular pharmacokinetics, chemical stability, safe reconstitution calculations, active half-lives, or peptide-stack combinations.

Here are some suggested topics we can discuss:
- **"Explain the synergy between BPC-157 and TB-500."**
- **"What are the tissue storage guidelines for reconstituted Semaglutide?"**
- **"Compare the action peaks of CJC-1295 with DAC vs No-DAC."**
- **"Explain why growth hormone secretagogues must be taken on an empty stomach."**

*Disclaimer: This tool is strictly for scientific, informational, and educational reference. It does not provide medical or diagnostic advice.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with AI.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: data.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please check your API key setup.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const promptSuggestions = [
    {
      title: "BPC-157 & TB-500 Synergy",
      prompt: "Explain the synergistic pathways of stacking BPC-157 and TB-500 for ligament healing.",
    },
    {
      title: "CJC-1295 / Ipamorelin empty stomach",
      prompt: "Why must Ipamorelin and CJC-1295 be administered on an empty stomach? Detail the role of insulin.",
    },
    {
      title: "Storage Stability",
      prompt: "What is the physical degradation time of reconstituted Tirzepatide when left at room temperature vs refrigerated?",
    },
    {
      title: "Epitalon Protocols",
      prompt: "Detail the established historical research protocols for Epitalon telomere elongation cycles.",
    },
  ];

  return (
    <div className="flex flex-col h-[650px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden">
      {/* Assistant Header */}
      <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              AI Peptide Assistant
            </h3>
            <span className="text-[10px] text-slate-400 font-bold font-mono">
              GEMINI-3.5-FLASH • SECURE AGENT
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to clear this research chat session?")) {
              setMessages([messages[0]]);
              setError(null);
            }
          }}
          className="text-xs text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-150 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80 transition-all cursor-pointer"
        >
          Clear Session
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-slate-950/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 max-w-3xl ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === "user"
                  ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              }`}
            >
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className="space-y-1 max-w-[85%]">
              <div
                className={`p-4 rounded-2xl border text-sm shadow-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white border-slate-800 rounded-tr-none dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                    : "bg-white text-slate-800 border-slate-100 rounded-tl-none dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800/60"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>
              <span className={`text-[9px] font-mono font-semibold text-slate-400 block px-1 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 mr-auto max-w-md animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 w-full">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800/60 flex items-center gap-2 text-slate-400 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>AI is compiling scientific literature references...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-4 rounded-xl flex gap-3 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wide">
                API Connection Issue
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Block */}
      {messages.length === 1 && !isLoading && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-150 dark:border-slate-850 shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 font-mono">
            Suggested Research Questions
          </span>
          <div className="grid grid-cols-2 gap-2">
            {promptSuggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug.prompt)}
                className="text-left bg-white hover:bg-emerald-50/40 dark:bg-slate-900 dark:hover:bg-slate-800/80 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 hover:border-emerald-200 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold cursor-pointer shadow-sm hover:shadow transition-all line-clamp-1"
              >
                {sug.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 shrink-0 flex gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          placeholder="Ask a scientific question about peptides or stack safety..."
          className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200 resize-none max-h-24 leading-relaxed font-medium"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white p-3 rounded-xl transition-all shadow-sm shadow-emerald-500/10 cursor-pointer shrink-0 self-end"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
