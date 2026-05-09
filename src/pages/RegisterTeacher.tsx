// src/pages/RegisterTeacher.tsx

import { useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { UserPlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export default function RegisterTeacherPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      address: "",
      joiningDate: "",
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
      navigate("/teachers");
    },

    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to register teacher"));
    },
  });

  return (
    <div className="tm-page">
      {/* HERO */}
      <div className="tm-hero">
        <div className="tm-hero-glow" />
        <div className="tm-hero-inner">
          <div className="tm-hero-left">
            <div className="tm-hero-icon-wrap">
              <UserPlus />
            </div>
            <div className="tm-hero-text">
              <h2 className="tm-hero-title">Register Teacher</h2>
              <p className="tm-hero-sub">Create and register a new teacher profile</p>
            </div>
          </div>
          <span className="tm-hero-badge">New Profile</span>
        </div>
      </div>

      {/* FORM CARD — wide, two-column on desktop */}
      <div className="tm-form-card tm-form-card--wide">
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>

          {/* Two columns on ≥900px: Personal+Contact | Credentials+Employment */}
          <div className="tm-form-row-split">

            {/* ── LEFT COLUMN ── */}
            <div className="tm-form-col">

              {/* PERSONAL */}
              <div className="tm-form-section">
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
                <div className="tm-field" style={{ marginTop: "1rem" }}>
                  <Label>Date of Birth</Label>
                  <Input type="date" {...form.register("dateOfBirth")} />
                </div>
              </div>

              {/* CONTACT */}
              <div className="tm-form-section">
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
                <div className="tm-field" style={{ marginTop: "1rem" }}>
                  <Label>Address</Label>
                  <Textarea rows={4} {...form.register("address")} />
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="tm-form-col">

              {/* CREDENTIALS */}
              <div className="tm-form-section">
                <div className="tm-section-label">Credentials</div>
                <div className="tm-field">
                  <Label>Password</Label>
                  <Input type="password" {...form.register("password")} />
                  <ErrorText text={form.formState.errors.password?.message} />
                </div>
              </div>

              {/* EMPLOYMENT */}
              <div className="tm-form-section">
                <div className="tm-section-label">Employment</div>
                <div className="tm-field">
                  <Label>Joining Date</Label>
                  <Input type="date" {...form.register("joiningDate")} />
                </div>
              </div>

            </div>

          </div>

          {/* ACTIONS */}
          <div className="tm-form-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/teachers")}
            >
              Cancel
            </Button>
            <SubmitButton loading={mutation.isPending}>
              Register Teacher
            </SubmitButton>
          </div>

        </form>
      </div>
    </div>
  );
}