import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import SubmitButton from "@/components/common/SubmitButton";
import { login, isAuthenticated } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (isAuthenticated()) {
    return null;
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back!");
      const dest = location.state?.from?.pathname || "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold">School Admin</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-semibold leading-tight max-w-md">
            Manage students, teachers and academics in one place.
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-md">
            A focused, professional console for everyday school operations.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/70">© {new Date().getFullYear()} School Admin</div>
        <div
          aria-hidden
          className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full"
          style={{ background: "radial-gradient(closest-side, hsl(var(--primary-foreground) / 0.15), transparent)" }}
        />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mb-6 lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold">School Admin</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access the admin panel.
          </p>

          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <SubmitButton loading={submitting} className="w-full">
              Sign in
            </SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
