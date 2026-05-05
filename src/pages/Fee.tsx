import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Fee() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="relative w-full max-w-md overflow-hidden p-10 text-center" style={{ boxShadow: "var(--shadow-elegant)" }}>
        <div className="absolute inset-x-0 top-0 h-1 shimmer" />
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary animate-pulse">
          <Construction className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold">Fee Management</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This module is currently under development. Please check back soon.
        </p>
      </Card>
    </div>
  );
}
