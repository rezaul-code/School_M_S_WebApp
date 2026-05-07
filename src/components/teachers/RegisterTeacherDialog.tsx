import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserPlus, Mail, Lock, User, Phone, Calendar, MapPin, Briefcase,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import SubmitButton from "@/components/common/SubmitButton";

import { registerTeacher } from "@/lib/api/teachers";
import { getApiErrorMessage } from "@/lib/api/client";

// ─── Validation schema ────────────────────────────────────────────────────────

const schema = z.object({
  firstName:   z.string().min(1, "First name is required"),
  lastName:    z.string().min(1, "Last name is required"),
  email:       z.string().min(1, "Email is required").email("Enter a valid email"),
  password:    z.string().min(6, "Password must be at least 6 characters"),
  phone:       z
    .string()
    .optional()
    .refine((v) => !v || /^\d{7,15}$/.test(v), "Enter a valid phone number"),
  dateOfBirth: z.string().optional(),
  joiningDate: z.string().optional(),
  address:     z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  firstName: "", lastName: "", email: "", password: "",
  phone: "", dateOfBirth: "", joiningDate: "", address: "",
};

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  icon,
  required,
  children,
}: {
  label: string;
  error?: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        <span className="text-muted-foreground/70">{icon}</span>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
        {title}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  trigger: React.ReactNode;
}

export default function RegisterTeacherDialog({ trigger }: Props) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      registerTeacher({
        email:       values.email,
        password:    values.password,
        firstName:   values.firstName,
        lastName:    values.lastName,
        phone:       values.phone       || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        address:     values.address     || undefined,
        joiningDate: values.joiningDate || undefined,
      }),
    onSuccess: (data) => {
      const name = data?.firstName
        ? `${data.firstName} ${data.lastName}`
        : "Teacher";
      toast.success(`${name} registered successfully`);
      qc.invalidateQueries({ queryKey: ["teachers"] });
      reset(DEFAULT_VALUES);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Registration failed"));
    },
  });

  return (
    <Dialog onOpenChange={(open) => { if (!open) reset(DEFAULT_VALUES); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </span>
            Register New Teacher
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new teacher account.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="mt-2 space-y-5"
        >
          {/* ── Personal ── */}
          <SectionLabel title="Personal Information" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="First Name"
              error={errors.firstName?.message}
              icon={<User className="h-3.5 w-3.5" />}
              required
            >
              <Input
                {...register("firstName")}
                placeholder="Raju"
                autoComplete="given-name"
                className={errors.firstName ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
            </Field>

            <Field
              label="Last Name"
              error={errors.lastName?.message}
              icon={<User className="h-3.5 w-3.5" />}
              required
            >
              <Input
                {...register("lastName")}
                placeholder="Rahman"
                autoComplete="family-name"
                className={errors.lastName ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Phone"
              error={errors.phone?.message}
              icon={<Phone className="h-3.5 w-3.5" />}
            >
              <Input
                {...register("phone")}
                placeholder="9876543210"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                className={errors.phone ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
            </Field>

            <Field
              label="Date of Birth"
              error={errors.dateOfBirth?.message}
              icon={<Calendar className="h-3.5 w-3.5" />}
            >
              <Input
                {...register("dateOfBirth")}
                type="date"
                className={errors.dateOfBirth ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
            </Field>
          </div>

          <Field
            label="Address"
            error={errors.address?.message}
            icon={<MapPin className="h-3.5 w-3.5" />}
          >
            <Textarea
              {...register("address")}
              placeholder="Street, City, State"
              rows={2}
              className="resize-none"
            />
          </Field>

          {/* ── Employment ── */}
          <SectionLabel title="Employment" />

          <Field
            label="Joining Date"
            error={errors.joiningDate?.message}
            icon={<Briefcase className="h-3.5 w-3.5" />}
          >
            <Input
              {...register("joiningDate")}
              type="date"
              className="sm:max-w-[200px]"
            />
          </Field>

          {/* ── Credentials ── */}
          <SectionLabel title="Account Credentials" />

          <Field
            label="Email"
            error={errors.email?.message}
            icon={<Mail className="h-3.5 w-3.5" />}
            required
          >
            <Input
              {...register("email")}
              type="email"
              placeholder="teacher@school.com"
              autoComplete="email"
              className={errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}
            />
          </Field>

          <Field
            label="Password"
            error={errors.password?.message}
            icon={<Lock className="h-3.5 w-3.5" />}
            required
          >
            <Input
              {...register("password")}
              type="password"
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              className={errors.password ? "border-destructive focus-visible:ring-destructive/30" : ""}
            />
          </Field>

          {/* ── Footer ── */}
          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(DEFAULT_VALUES)}
              disabled={mutation.isPending}
            >
              Reset
            </Button>
            <SubmitButton loading={mutation.isPending} className="min-w-[140px]">
              Register Teacher
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}