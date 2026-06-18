"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center font-bold text-white text-sm"
          style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--teal) 100%)" }}
          title="AI Assistant"
        >
          AI
        </button>
      </div>

      {/* AI Chatbot Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-96 rounded-lg shadow-2xl z-40 overflow-hidden flex flex-col"
          style={{ background: "white", border: "1px solid var(--border)", height: "500px" }}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex items-center justify-between flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--teal) 100%)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">AI</span>
              <div>
                <h3 className="font-bold text-sm">Fleet Assistant</h3>
                <p className="text-xs opacity-90">Ask about your crew & vessels</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:opacity-80 transition"
              style={{ fontSize: "1.25rem", lineHeight: "1" }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8" style={{ color: "var(--muted)" }}>
                <div className="text-sm font-semibold mb-2">Welcome to Fleet Assistant</div>
                <div className="text-xs">Ask questions about your crew, vessels, compliance, or crew changes</div>
                <div className="text-xs mt-3 opacity-70">Examples:</div>
                <ul className="text-xs mt-2 space-y-1 opacity-70">
                  <li>&quot;How many crew are on board?&quot;</li>
                  <li>&quot;Show expiring certificates&quot;</li>
                  <li>&quot;Active crew changes?&quot;</li>
                </ul>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-xs px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: msg.role === "user" ? "var(--navy)" : "var(--bg)",
                      color: msg.role === "user" ? "white" : "var(--text)",
                      border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--navy)" }} />
                    <div className="w-2 h-2 rounded-full animate-pulse animation-delay-100" style={{ background: "var(--navy)" }} />
                    <div className="w-2 h-2 rounded-full animate-pulse animation-delay-200" style={{ background: "var(--navy)" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--border)] flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about crew, vessels..."
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-lg font-semibold text-white text-sm transition-all"
                style={{
                  background: loading || !input.trim() ? "var(--muted)" : "var(--navy)",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                }}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
