// src/components/dashboard/StatCard.tsx

import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  icon: LucideIcon;
  loading?: boolean;
  accent?: "primary" | "success" | "warning" | "destructive";
  sub?: string;
}

const accentClassMap: Record<string, string> = {
  primary: "db-stat-card--primary",
  success: "db-stat-card--success",
  warning: "db-stat-card--warning",
  destructive: "db-stat-card--violet",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent = "primary",
  sub,
}: StatCardProps) {
  return (
    <div className={cn("db-stat-card", accentClassMap[accent])}>
      <div className="db-stat-glow" />

      <div className="db-stat-top">
        <div className="db-stat-icon-wrap">
          <Icon />
        </div>
      </div>

      <div className="db-stat-body">
        <div className="db-stat-label">{label}</div>
        {loading ? (
          <Skeleton className="mt-1 h-8 w-20" />
        ) : (
          <div className="db-stat-value">{value ?? "—"}</div>
        )}
        {sub && !loading && (
          <div className="db-stat-sub">{sub}</div>
        )}
      </div>
    </div>
  );
}