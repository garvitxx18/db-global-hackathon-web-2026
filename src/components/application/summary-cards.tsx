import { AlertTriangle, CheckCircle2, Clock3, Layers } from "lucide-react";
import type { DashboardSummary } from "@/types/incidents";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cards = [
  {
    key: "total",
    label: "Total Funds",
    getValue: (s: DashboardSummary) => s.totalFunds,
    hint: "In current window",
    icon: Layers,
    tone: "neutral" as const,
  },
  {
    key: "published",
    label: "Published",
    getValue: (s: DashboardSummary) => s.published,
    hint: (s: DashboardSummary) => `${s.completionPercent}% completed`,
    icon: CheckCircle2,
    tone: "success" as const,
  },
  {
    key: "failed",
    label: "Failed",
    getValue: (s: DashboardSummary) => s.failed,
    hint: "Requires attention",
    icon: AlertTriangle,
    tone: "danger" as const,
  },
  {
    key: "inProgress",
    label: "In Progress",
    getValue: (s: DashboardSummary) => s.inProgress,
    hint: "Still processing",
    icon: Clock3,
    tone: "warning" as const,
  },
] as const;

const toneStyles = {
  neutral: "text-foreground",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
};

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const hint =
          typeof card.hint === "function" ? card.hint(summary) : card.hint;
        return (
          <Card
            key={card.key}
            className="border-border bg-surface shadow-sm ring-0"
          >
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-semibold tracking-tight tabular-nums",
                    toneStyles[card.tone]
                  )}
                >
                  {card.getValue(summary)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              </div>
              <span
                className={cn(
                  "rounded-lg bg-secondary p-2",
                  toneStyles[card.tone]
                )}
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
