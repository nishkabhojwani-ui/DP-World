"use client";

import { useState, useEffect } from "react";
import AIBadge from "./AIBadge";

interface Insight {
  id: string;
  title: string;
  description: string;
  type: "action" | "alert" | "recommendation" | "analysis";
  icon: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulated AI insights - in production, these would come from an API
    const mockInsights: Insight[] = [
      {
        id: "1",
        title: "Captain's Certificate Expiring",
        description: "AI detected 3 crew members with certificates expiring within 30 days",
        type: "alert",
        icon: "ALT",
      },
      {
        id: "2",
        title: "Rest Hour Optimization",
        description: "AI recommends adjusting shift schedule for Vessel MV-Alpha to comply with STCW regulations",
        type: "recommendation",
        icon: "REC",
      },
      {
        id: "3",
        title: "Crew Change Efficiency",
        description: "AI analyzed historical data: average crew change takes 4.2 days. Current change is on track.",
        type: "analysis",
        icon: "ANL",
      },
    ];
    setInsights(mockInsights);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "alert":
        return "var(--red)";
      case "action":
        return "var(--teal)";
      case "recommendation":
        return "var(--amber)";
      case "analysis":
        return "var(--navy)";
      default:
        return "var(--muted)";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "alert":
        return "AI Alert";
      case "action":
        return "AI Action";
      case "recommendation":
        return "AI Recommendation";
      case "analysis":
        return "AI Analysis";
      default:
        return "AI Insight";
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center font-bold text-white text-xl"
          style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--teal) 100%)" }}
          title="AI Assistant"
        >
          ✨
        </button>
      </div>

      {/* AI Assistant Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-96 rounded-lg shadow-2xl z-40 overflow-hidden"
          style={{ background: "white", border: "1px solid var(--border)" }}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--teal) 100%)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">AI</span>
              <div>
                <h3 className="font-bold text-sm">AI Assistant</h3>
                <p className="text-xs opacity-90">Real-time Fleet Insights</p>
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

          {/* Insights List */}
          <div className="max-h-96 overflow-y-auto">
            {insights.length === 0 ? (
              <div className="p-4 text-center" style={{ color: "var(--muted)" }}>
                <div className="text-sm">No active insights right now.</div>
                <div className="text-xs mt-1">AI is monitoring your fleet...</div>
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg)] transition cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="text-xl flex-shrink-0">{insight.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            background: getTypeColor(insight.type) + "22",
                            color: getTypeColor(insight.type),
                          }}
                        >
                          {getTypeLabel(insight.type)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                        {insight.title}
                      </h4>
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)] text-center text-xs" style={{ color: "var(--muted)" }}>
            AI-Powered Fleet Monitoring • Live Updates
          </div>
        </div>
      )}
    </>
  );
}
