import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SubmitButton from "@/components/common/SubmitButton";
import { createClassSubject } from "@/lib/api/classSubjects";
import { getClassLevelOptions } from "@/lib/api/master";
import { listSubjectOptions } from "@/lib/api/subjects";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  classLevelId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
});

type Values = z.infer<typeof schema>;

export interface CreateClassSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClassSubjectDialog({
  open,
  onOpenChange,
}: CreateClassSubjectDialogProps) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { classLevelId: "", subjectId: "" },
  });

  const classLevelsQ = useQuery({
    queryKey: ["class-levels-options"],
    queryFn: getClassLevelOptions,
    enabled: open,
  });

  const subjectsQ = useQuery({
    queryKey: ["subjects-options"],
    queryFn: listSubjectOptions,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (v: Values) =>
      createClassSubject({
        classLevelId: Number(v.classLevelId),
        subjectId: Number(v.subjectId),
      }),
    onSuccess: () => {
      toast.success("Mapping created successfully");
      qc.invalidateQueries({ queryKey: ["classSubjectMappings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => {
      console.error("Creation Error:", err);
      toast.error(getApiErrorMessage(err, "Failed to create mapping"));
    },
  });

  const onSubmit = (data: Values) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Class-Subject Mapping</DialogTitle>
          <DialogDescription>Assign a subject to a class level.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Class Level</Label>
            <Select
              value={form.watch("classLevelId")}
              onValueChange={(v) => form.setValue("classLevelId", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={classLevelsQ.isLoading ? "Loading classes..." : "Select class level"}
                />
              </SelectTrigger>
              <SelectContent>
                {(classLevelsQ.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.classLevelId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.classLevelId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Select
              value={form.watch("subjectId")}
              onValueChange={(v) => form.setValue("subjectId", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={subjectsQ.isLoading ? "Loading subjects..." : "Select subject"}
                />
              </SelectTrigger>
              <SelectContent>
                {(subjectsQ.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.subjectId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.subjectId.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton loading={mutation.isPending}>Create Mapping</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}