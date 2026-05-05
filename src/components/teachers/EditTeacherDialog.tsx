import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import SubmitButton from "@/components/common/SubmitButton";
import { updateTeacher } from "@/lib/api/teachers";
import { getApiErrorMessage } from "@/lib/api/client";
import type { Teacher } from "@/types/api";

const schema = z.object({
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

interface Props {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function EditTeacherDialog({ teacher, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", address: "" },
  });

  useEffect(() => {
    if (teacher && open) {
      form.reset({ phone: teacher.phone ?? "", address: teacher.address ?? "" });
    }
  }, [teacher, open, form]);

  const mutation = useMutation({
    mutationFn: (v: Values) => updateTeacher(teacher!.id, v),
    onSuccess: () => {
      toast.success("Teacher updated");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["teacher", teacher?.id] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Update failed")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogDescription>
            {teacher ? `${teacher.firstName} ${teacher.lastName}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v as Values))}>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...form.register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea rows={3} {...form.register("address")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton loading={mutation.isPending}>Save changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
