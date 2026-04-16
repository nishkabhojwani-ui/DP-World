import AIBadge from "./AIBadge";

interface AIPageHeaderProps {
  section: string;
  title: string;
  subtitle: string;
  badges?: Array<"generated" | "verified" | "scored" | "flagged" | "detected" | "analyzed">;
  icon?: string;
}

export default function AIPageHeader({
  section,
  title,
  subtitle,
  badges = [],
  icon = "✨",
}: AIPageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-row">
        <div>
          <p className="section-label mb-1">{section}</p>
          <div className="flex items-center gap-3">
            <h1 className="page-title">{icon} {title}</h1>
            {badges.length > 0 && (
              <div className="flex gap-2">
                {badges.map((badge, i) => (
                  <AIBadge key={i} type={badge} size="sm" />
                ))}
              </div>
            )}
          </div>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
