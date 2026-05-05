import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  icon: LucideIcon;
  loading?: boolean;
  accent?: "primary" | "success" | "warning" | "destructive";
}

const accentMap = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
} as const;

export default function StatCard({ label, value, icon: Icon, loading, accent = "primary" }: StatCardProps) {
  return (
    <Card className="p-5 flex items-center gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", accentMap[accent])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        {loading ? (
          <Skeleton className="mt-1 h-7 w-16" />
        ) : (
          <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value ?? "—"}</div>
        )}
      </div>
    </Card>
  );
}
