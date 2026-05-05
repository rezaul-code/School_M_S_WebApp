import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number; // 0-based
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const max = totalPages - 1;
  const range: number[] = [];
  const start = Math.max(0, Math.min(page - 2, max - 4));
  const end = Math.min(max, start + 4);
  for (let i = start; i <= end; i++) range.push(i);

  return (
    <div className="flex items-center justify-between gap-2 pt-4">
      <div className="text-xs text-muted-foreground">
        Page {page + 1} of {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {range.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            className={cn("h-8 min-w-8 px-2")}
            onClick={() => onChange(p)}
          >
            {p + 1}
          </Button>
        ))}
        <Button variant="outline" size="sm" disabled={page >= max} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
