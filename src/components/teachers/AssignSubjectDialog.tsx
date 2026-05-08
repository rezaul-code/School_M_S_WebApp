import { useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SubmitButton from "@/components/common/SubmitButton";

import {
  assignSubjectToTeacher,
  getClassLevels,
  getSectionsByClassLevel,
  getSubjects,
} from "@/lib/api/teachers";

import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  classLevelId: z.string().min(1, "Class level required"),
  subjectId: z.string().min(1, "Subject required"),
  classSectionId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  teacherId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AssignSubjectDialog({
  teacherId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      classLevelId: "",
      subjectId: "",
      classSectionId: "",
    },
  });

  const selectedClassLevelId = form.watch("classLevelId");

  // Clear dependent fields when class level changes
  useEffect(() => {
    form.setValue("subjectId", "");
    form.setValue("classSectionId", "");
  }, [selectedClassLevelId, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const classLevelsQuery = useQuery({
    queryKey: ["class-levels"],
    queryFn: getClassLevels,
  });

  // Only fires once a class level is selected; re-fires when it changes
  const subjectsQuery = useQuery({
    queryKey: ["subjects", selectedClassLevelId],
    queryFn: () => getSubjects(Number(selectedClassLevelId)),
    enabled: !!selectedClassLevelId,
  });

  // Only fires once a class level is selected; re-fires when it changes
  const sectionsQuery = useQuery({
    queryKey: ["sections", selectedClassLevelId],
    queryFn: () => getSectionsByClassLevel(Number(selectedClassLevelId)),
    enabled: !!selectedClassLevelId,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      assignSubjectToTeacher(teacherId, {
        classLevelId: Number(values.classLevelId),
        subjectId: Number(values.subjectId),
        classSectionId: values.classSectionId
          ? Number(values.classSectionId)
          : undefined,
      }),

    onSuccess: () => {
      toast.success("Subject assigned successfully");

      qc.invalidateQueries({
        queryKey: ["subject-assignments", teacherId],
      });
      qc.invalidateQueries({
        queryKey: ["teacher-assignments-page"],
      });

      onOpenChange(false);
      onSuccess?.();
    },

    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to assign subject"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Subject</DialogTitle>
          <DialogDescription>
            Assign a subject to this teacher
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          {/* CLASS LEVEL */}
          <div className="space-y-1.5">
            <Label>Class Level</Label>
            <Select
              value={form.watch("classLevelId")}
              onValueChange={(value) =>
                form.setValue("classLevelId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class level" />
              </SelectTrigger>
              <SelectContent>
                {classLevelsQuery.data?.map((level) => (
                  <SelectItem key={level.id} value={String(level.id)}>
                    {level.displayName || level.name}
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

          {/* SUBJECT */}
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Select
              value={form.watch("subjectId")}
              onValueChange={(value) => form.setValue("subjectId", value)}
              disabled={!selectedClassLevelId || subjectsQuery.isLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedClassLevelId
                      ? "Select a class level first"
                      : subjectsQuery.isLoading
                      ? "Loading subjects…"
                      : subjectsQuery.data?.length === 0
                      ? "No subjects mapped to this class"
                      : "Select subject"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subjectsQuery.data?.map((subject) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
                    {subject.name} ({subject.code})
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

          {/* SECTION (optional) */}
          <div className="space-y-1.5">
            <Label>Section (optional)</Label>
            <Select
              value={form.watch("classSectionId")}
              onValueChange={(value) =>
                form.setValue("classSectionId", value)
              }
              disabled={!selectedClassLevelId || sectionsQuery.isLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedClassLevelId
                      ? "Select a class level first"
                      : sectionsQuery.isLoading
                      ? "Loading sections…"
                      : sectionsQuery.data?.length === 0
                      ? "No sections for this class"
                      : "Select section"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sectionsQuery.data?.map((section) => (
                  <SelectItem key={section.id} value={String(section.id)}>
                    {section.displayName || section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <SubmitButton loading={mutation.isPending}>
              Assign Subject
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}