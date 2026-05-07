import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import SubmitButton from "../common/SubmitButton";
import { 
  createClassSection, 
  listAcademicYears, 
  getClassLevelOptions, 
  getSectionOptions 
} from "../../lib/api/master";
import { getApiErrorMessage } from "../../lib/api/client";

const schema = z.object({
  classLevelId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
});

type Values = z.infer<typeof schema>;

export interface CreateClassSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClassSectionDialog({
  open,
  onOpenChange,
}: CreateClassSectionDialogProps) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { classLevelId: "", sectionId: "", academicYearId: "" },
  });

  // Fetch Options from Master Data Helper APIs
  const yearsQ = useQuery({
    queryKey: ["academic-years"],
    queryFn: listAcademicYears,
    enabled: open,
  });

  const classLevelsQ = useQuery({
    queryKey: ["class-levels-options"],
    queryFn: getClassLevelOptions,
    enabled: open,
  });

  const sectionsQ = useQuery({
    queryKey: ["sections-options"],
    queryFn: getSectionOptions,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (v: Values) => createClassSection({
      classLevelId: Number(v.classLevelId),
      sectionId: Number(v.sectionId),
      academicYearId: Number(v.academicYearId),
    }),
    onSuccess: () => {
      toast.success("Class section created successfully");
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
          <DialogTitle>Create Class Section Mapping</DialogTitle>
          <DialogDescription>Map a class level to a specific section for an academic year.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          {/* Class Level Selection */}
          <div className="space-y-1.5">
            <Label>Class Level</Label>
            <Select
              value={form.watch("classLevelId")}
              onValueChange={(v) => form.setValue("classLevelId", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={classLevelsQ.isLoading ? "Loading classes..." : "Select class level"} />
              </SelectTrigger>
              <SelectContent>
                {(classLevelsQ.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.classLevelId && (
              <p className="text-xs text-destructive">{form.formState.errors.classLevelId.message}</p>
            )}
          </div>

          {/* Section Selection */}
          <div className="space-y-1.5">
            <Label>Section</Label>
            <Select
              value={form.watch("sectionId")}
              onValueChange={(v) => form.setValue("sectionId", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={sectionsQ.isLoading ? "Loading sections..." : "Select section"} />
              </SelectTrigger>
              <SelectContent>
                {(sectionsQ.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.sectionId && (
              <p className="text-xs text-destructive">{form.formState.errors.sectionId.message}</p>
            )}
          </div>

          {/* Academic Year Selection */}
          <div className="space-y-1.5">
            <Label>Academic Year</Label>
            <Select
              value={form.watch("academicYearId")}
              onValueChange={(v) => form.setValue("academicYearId", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={yearsQ.isLoading ? "Loading years..." : "Select academic year"} />
              </SelectTrigger>
              <SelectContent>
                {(yearsQ.data ?? []).map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.academicYearId && (
              <p className="text-xs text-destructive">{form.formState.errors.academicYearId.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton loading={mutation.isPending}>Create Mapping</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}