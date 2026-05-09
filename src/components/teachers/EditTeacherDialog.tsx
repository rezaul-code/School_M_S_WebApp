// src/components/teachers/EditTeacherDialog.tsx

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import SubmitButton from "@/components/common/SubmitButton";

import { updateTeacher } from "@/lib/api/teachers";
import { getApiErrorMessage } from "@/lib/api/client";

import type { Teacher } from "@/types/api";

import "@/styles/teacher.css";

const schema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditTeacherDialog({ teacher, open, onOpenChange }: Props) {
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", address: "" },
  });

  useEffect(() => {
    if (teacher) {
      form.reset({ phone: teacher.phone || "", address: teacher.address || "" });
    } else {
      form.reset({ phone: "", address: "" });
    }
  }, [teacher, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!teacher) throw new Error("No teacher selected");
      return updateTeacher(teacher.id, {
        phone: values.phone || undefined,
        address: values.address || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Teacher updated successfully");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update teacher"));
    },
  });

  const displayName =
    teacher?.fullName ||
    `${teacher?.firstName || ""} ${teacher?.lastName || ""}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md tm-dialog">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogDescription>{displayName}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="tm-section-label">Contact Details</div>

          <div className="tm-field">
            <Label>Phone</Label>
            <Input {...form.register("phone")} />
          </div>

          <div className="tm-field">
            <Label>Address</Label>
            <Textarea rows={3} {...form.register("address")} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton loading={mutation.isPending}>Save Changes</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}