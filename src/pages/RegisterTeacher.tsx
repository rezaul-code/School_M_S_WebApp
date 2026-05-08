import { useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import SubmitButton from "@/components/common/SubmitButton";

import { registerTeacher } from "@/lib/api/teachers";
import { getApiErrorMessage } from "@/lib/api/client";

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
  return <p className="text-xs text-destructive">{text}</p>;
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
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Register Teacher</h1>
        <p className="text-sm text-muted-foreground">
          Create and register a new teacher profile
        </p>
      </div>

      <Card className="p-6 max-w-2xl">
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-6"
        >
          {/* PERSONAL */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Personal Information</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input {...form.register("firstName")} />
                <ErrorText
                  text={form.formState.errors.firstName?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input {...form.register("lastName")} />
                <ErrorText
                  text={form.formState.errors.lastName?.message}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" {...form.register("dateOfBirth")} />
            </div>
          </div>

          {/* CONTACT */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contact Information</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...form.register("email")} />
                <ErrorText text={form.formState.errors.email?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...form.register("phone")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea rows={3} {...form.register("address")} />
            </div>
          </div>

          {/* CREDENTIALS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Credentials</h3>

            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} />
              <ErrorText
                text={form.formState.errors.password?.message}
              />
            </div>
          </div>

          {/* EMPLOYMENT */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Employment</h3>

            <div className="space-y-1.5">
              <Label>Joining Date</Label>
              <Input type="date" {...form.register("joiningDate")} />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 border-t pt-4">
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
      </Card>
    </div>
  );
}