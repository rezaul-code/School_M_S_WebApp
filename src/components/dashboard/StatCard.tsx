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
  customIcon?: React.ReactNode;
}

const accentCircleMap: Record<string, string> = {
  primary:     "db-stat-circle--primary",
  success:     "db-stat-circle--success",
  warning:     "db-stat-circle--warning",
  destructive: "db-stat-circle--destructive",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent = "primary",
  sub,
  customIcon,
}: StatCardProps) {
  return (
    <div className="db-stat-card-v2">
      <div className={cn("db-stat-circle", accentCircleMap[accent])}>
        {customIcon ?? <Icon />}
      </div>
      <div className="db-stat-body">
        <div className="db-stat-label-v2">{label}</div>
        {loading ? (
          <Skeleton className="mt-1 h-8 w-20" />
        ) : (
          <div className="db-stat-value-v2">{value ?? "—"}</div>
        )}
        {sub && !loading && (
          <div className="db-stat-sub">{sub}</div>
        )}
      </div>
    </div>
  );
}