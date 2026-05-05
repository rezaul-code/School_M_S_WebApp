import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SubmitButton from "@/components/common/SubmitButton";
import { CLASS_OPTIONS, createClassSection, listAcademicYears } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  className: z.string().min(1, "Class is required"),
  sectionName: z.string().min(1, "Section is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
});
type Values = z.infer<typeof schema>;

export default function CreateClassSectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { className: "", sectionName: "", academicYearId: "" },
  });

  const yearsQ = useQuery({
    queryKey: ["academic-years"],
    queryFn: listAcademicYears,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: createClassSection,
    onSuccess: () => {
      toast.success("Class section created");
      qc.invalidateQueries({ queryKey: ["class-sections"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to create class section")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Class Section</DialogTitle>
          <DialogDescription>Add a section to a class for an academic year.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select
              value={form.watch("className")}
              onValueChange={(v) => form.setValue("className", v, { shouldValidate: true })}
            >
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.className && (
              <p className="text-xs text-destructive">{form.formState.errors.className.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sec">Section name</Label>
            <Input id="sec" placeholder="A" {...form.register("sectionName")} />
            {form.formState.errors.sectionName && (
              <p className="text-xs text-destructive">{form.formState.errors.sectionName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Academic year</Label>
            <Select
              value={form.watch("academicYearId")}
              onValueChange={(v) => form.setValue("academicYearId", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={yearsQ.isLoading ? "Loading..." : "Select year"} />
              </SelectTrigger>
              <SelectContent>
                {(yearsQ.data ?? []).map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}> {/* ← fix: ensure string value */}
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.academicYearId && (
              <p className="text-xs text-destructive">{form.formState.errors.academicYearId.message}</p>
            )}
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