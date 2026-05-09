// src/components/teachers/RegisterTeacherDialog.tsx

import { useState } from "react";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import SubmitButton from "@/components/common/SubmitButton";

import { registerTeacher } from "@/lib/api/teachers";
import { getApiErrorMessage } from "@/lib/api/client";

import "@/styles/teacher.css";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  joiningDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function ErrorText({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="tm-field-error">{text}</p>;
}

interface Props {
  trigger: React.ReactNode;
}

export default function RegisterTeacherDialog({ trigger }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "", password: "", firstName: "", lastName: "",
      phone: "", dateOfBirth: "", address: "", joiningDate: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      registerTeacher({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        address: values.address || undefined,
        joiningDate: values.joiningDate || undefined,
      }),
    onSuccess: () => {
      toast.success("Teacher registered successfully");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      form.reset();
      setOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to register teacher"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl tm-dialog">
        <DialogHeader>
          <DialogTitle>Register Teacher</DialogTitle>
          <DialogDescription>Create a new teacher profile</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          style={{ marginTop: "0.5rem" }}
        >
          {/* PERSONAL */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="tm-section-label">Personal Information</div>
            <div className="tm-grid-2">
              <div className="tm-field">
                <Label>First Name</Label>
                <Input {...form.register("firstName")} />
                <ErrorText text={form.formState.errors.firstName?.message} />
              </div>
              <div className="tm-field">
                <Label>Last Name</Label>
                <Input {...form.register("lastName")} />
                <ErrorText text={form.formState.errors.lastName?.message} />
              </div>
            </div>
            <div className="tm-field" style={{ marginTop: "0.875rem" }}>
              <Label>Date of Birth</Label>
              <Input type="date" {...form.register("dateOfBirth")} />
            </div>
          </div>

          {/* CONTACT */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="tm-section-label">Contact Information</div>
            <div className="tm-grid-2">
              <div className="tm-field">
                <Label>Email</Label>
                <Input type="email" {...form.register("email")} />
                <ErrorText text={form.formState.errors.email?.message} />
              </div>
              <div className="tm-field">
                <Label>Phone</Label>
                <Input {...form.register("phone")} />
              </div>
            </div>
            <div className="tm-field" style={{ marginTop: "0.875rem" }}>
              <Label>Address</Label>
              <Textarea rows={3} {...form.register("address")} />
            </div>
          </div>

          {/* CREDENTIALS */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="tm-section-label">Credentials</div>
            <div className="tm-field">
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} />
              <ErrorText text={form.formState.errors.password?.message} />
            </div>
          </div>

          {/* EMPLOYMENT */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="tm-section-label">Employment</div>
            <div className="tm-field">
              <Label>Joining Date</Label>
              <Input type="date" {...form.register("joiningDate")} />
            </div>
          </div>

          {/* ACTIONS */}
          <div
            className="flex justify-end gap-3 border-t pt-4"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton loading={mutation.isPending}>Register Teacher</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}