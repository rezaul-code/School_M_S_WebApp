import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getFormOptions } from "@/lib/api/students";

function renderValue(v: unknown): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  if (Array.isArray(v)) {
    return (
      <div className="flex flex-wrap gap-1">
        {v.map((item, i) => (
          <span key={i} className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs">
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof v === "object") {
    return (
      <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">{JSON.stringify(v, null, 2)}</pre>
    );
  }
  return <span className="text-sm">{String(v)}</span>;
}

export default function FormOptionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const q = useQuery({
    queryKey: ["form-options"],
    queryFn: getFormOptions,
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Options</DialogTitle>
          <DialogDescription>Reference data used across student forms.</DialogDescription>
        </DialogHeader>
        {q.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        )}
        {q.data && (
          <div className="grid gap-3">
            {Object.entries(q.data).map(([key, value]) => (
              <div key={key} className="rounded-md border border-border p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{key}</div>
                <div className="mt-1.5">{renderValue(value)}</div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
