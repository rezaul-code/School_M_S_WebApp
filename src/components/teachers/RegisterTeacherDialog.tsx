import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SubmitButton from "@/components/common/SubmitButton";
import { registerTeacher } from "@/lib/api/teachers";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 chars"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

export default function RegisterTeacherDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "", phone: "", dateOfBirth: "", address: "", joiningDate: "" },
  });

  const mutation = useMutation({
    mutationFn: registerTeacher,
    onSuccess: () => {
      toast.success("Teacher registered");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      setOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to register teacher")),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Teacher</DialogTitle>
          <DialogDescription>Add a new teaching staff member.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => {
            const payload: Record<string, unknown> = { ...v };
            Object.keys(payload).forEach((k) => { if (payload[k] === "") delete payload[k]; });
            mutation.mutate(payload as unknown as Parameters<typeof registerTeacher>[0]);
          })}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={form.formState.errors.firstName?.message}>
              <Input {...form.register("firstName")} />
            </Field>
            <Field label="Last name" error={form.formState.errors.lastName?.message}>
              <Input {...form.register("lastName")} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Password" error={form.formState.errors.password?.message}>
              <Input type="password" {...form.register("password")} />
            </Field>
            <Field label="Phone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="Date of birth">
              <Input type="date" {...form.register("dateOfBirth")} />
            </Field>
            <Field label="Joining date">
              <Input type="date" {...form.register("joiningDate")} />
            </Field>
          </div>
          <Field label="Address">
            <Textarea rows={2} {...form.register("address")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <SubmitButton loading={mutation.isPending}>Register</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
