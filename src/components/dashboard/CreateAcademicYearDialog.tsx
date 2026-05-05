import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SubmitButton from "@/components/common/SubmitButton";
import { createAcademicYear } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

export default function CreateAcademicYearDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", startDate: "", endDate: "", active: false },
  });

  const mutation = useMutation({
    mutationFn: createAcademicYear,
    onSuccess: () => {
      toast.success("Academic year created");
      qc.invalidateQueries({ queryKey: ["academic-years"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to create academic year")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Academic Year</DialogTitle>
          <DialogDescription>Define a new academic year period.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v as Parameters<typeof createAcademicYear>[0]))}>
          <div className="space-y-1.5">
            <Label htmlFor="ay-name">Name</Label>
            <Input id="ay-name" placeholder="2025-2026" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ay-start">Start date</Label>
              <Input id="ay-start" type="date" {...form.register("startDate")} />
              {form.formState.errors.startDate && <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ay-end">End date</Label>
              <Input id="ay-end" type="date" {...form.register("endDate")} />
              {form.formState.errors.endDate && <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="ay-active" className="text-sm">Active</Label>
              <p className="text-xs text-muted-foreground">Mark this year as the current active year.</p>
            </div>
            <Switch
              id="ay-active"
              checked={form.watch("active")}
              onCheckedChange={(v) => form.setValue("active", v)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton loading={mutation.isPending}>Create</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
