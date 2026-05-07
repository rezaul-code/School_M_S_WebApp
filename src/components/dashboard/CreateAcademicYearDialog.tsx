import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import SubmitButton from "../common/SubmitButton";

import { createAcademicYear } from "../../lib/api/master";
import { getApiErrorMessage } from "../../lib/api/client";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  active: z.boolean(),
});

type Values = z.infer<typeof schema>;

export interface CreateAcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAcademicYearDialog({
  open,
  onOpenChange,
}: CreateAcademicYearDialogProps) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", startDate: "", endDate: "", active: true },
  });

  const mutation = useMutation({
    mutationFn: createAcademicYear,
    onSuccess: () => {
      toast.success("Academic year created successfully");
      // Refresh the list and dashboard stats
      qc.invalidateQueries({ queryKey: ["academic-years"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => {
      console.error("Creation Error:", err);
      toast.error(getApiErrorMessage(err, "Failed to create academic year"));
    },
  });

  // Explicitly defining the logic and casting 'data' resolves the TypeScript 
  // optionality mismatch error seen in the screenshot.
  const onSubmit = (data: Values) => {
    mutation.mutate({
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      active: data.active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Academic Year</DialogTitle>
          <DialogDescription>Define a new academic period.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="ay-name">Year Name</Label>
            <Input id="ay-name" placeholder="2026-2027" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ay-start">Start Date</Label>
              <Input id="ay-start" type="date" {...form.register("startDate")} />
              {form.formState.errors.startDate && <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ay-end">End Date</Label>
              <Input id="ay-end" type="date" {...form.register("endDate")} />
              {form.formState.errors.endDate && <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="ay-active" className="text-sm font-medium">Active Status</Label>
              <p className="text-xs text-muted-foreground">Set as the current active academic year.</p>
            </div>
            <Switch
              id="ay-active"
              checked={form.watch("active")}
              onCheckedChange={(v) => form.setValue("active", v)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton loading={mutation.isPending}>Create Year</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}