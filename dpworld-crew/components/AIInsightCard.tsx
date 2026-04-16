interface AIInsightCardProps {
  title: string;
  description: string;
  icon: string;
  type: "alert" | "recommendation" | "analysis" | "action";
  details?: Array<{ label: string; value: string | number }>;
}

export default function AIInsightCard({
  title,
  description,
  icon,
  type,
  details = [],
}: AIInsightCardProps) {
  const typeConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
    alert: {
      bg: "rgba(229, 52, 26, 0.08)",
      border: "rgba(229, 52, 26, 0.2)",
      text: "#E5341A",
      label: "AI Alert",
    },
    recommendation: {
      bg: "rgba(255, 165, 0, 0.08)",
      border: "rgba(255, 165, 0, 0.2)",
      text: "#FFA500",
      label: "AI Recommendation",
    },
    analysis: {
      bg: "rgba(0, 61, 122, 0.08)",
      border: "rgba(0, 61, 122, 0.2)",
      text: "#003D7A",
      label: "AI Analysis",
    },
    action: {
      bg: "rgba(0, 161, 154, 0.08)",
      border: "rgba(0, 161, 154, 0.2)",
      text: "#00A19A",
      label: "AI Action",
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className="p-4 rounded-lg border-l-4"
      style={{
        background: config.bg,
        borderColor: config.text,
        borderTop: `1px solid ${config.border}`,
        borderRight: `1px solid ${config.border}`,
        borderBottom: `1px solid ${config.border}`,
      }}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 font-bold text-sm text-white flex-shrink-0" style={{ background: config.text }}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm" style={{ color: config.text }}>
              {title}
            </h4>
            <span
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: config.text + "22", color: config.text }}
            >
              {config.label}
            </span>
          </div>
          <p className="text-sm text-[var(--muted)] mb-3">{description}</p>

          {details.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {details.map((detail, i) => (
                <div key={i} className="text-xs">
                  <span style={{ color: "var(--muted)" }}>{detail.label}: </span>
                  <span className="font-semibold" style={{ color: config.text }}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
