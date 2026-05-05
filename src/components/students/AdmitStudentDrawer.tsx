import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SubmitButton from "@/components/common/SubmitButton";
import { admitStudent } from "@/lib/api/students";
import { listClassSections } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  rollNumber: z.string().min(1),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  guardianName: z.string().optional().or(z.literal("")),
  guardianPhone: z.string().optional().or(z.literal("")),
  admissionDate: z.string().optional().or(z.literal("")),
  classSectionId: z.string().min(1, "Class section is required"),
});
type Values = z.infer<typeof schema>;

export default function AdmitStudentDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();

  const sectionsQ = useQuery({ queryKey: ["class-sections"], queryFn: listClassSections, enabled: open });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "", password: "", firstName: "", lastName: "", rollNumber: "",
      phone: "", dateOfBirth: "", address: "", guardianName: "", guardianPhone: "",
      admissionDate: "", classSectionId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: admitStudent,
    onSuccess: () => {
      toast.success("Student admitted");
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to admit student")),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Admit Student</SheetTitle>
          <SheetDescription>Create a student account and enroll them.</SheetDescription>
        </SheetHeader>
        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit(((v: Values) => {
            const payload: Record<string, unknown> = { ...v };
            Object.keys(payload).forEach((k) => {
              if (payload[k] === "") delete payload[k];
            });
            mutation.mutate(payload as unknown as Parameters<typeof admitStudent>[0]);
          }) as SubmitHandler<Values>)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <Field label="Roll number" error={form.formState.errors.rollNumber?.message}>
              <Input {...form.register("rollNumber")} />
            </Field>
            <Field label="Phone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="Date of birth">
              <Input type="date" {...form.register("dateOfBirth")} />
            </Field>
            <Field label="Admission date">
              <Input type="date" {...form.register("admissionDate")} />
            </Field>
            <Field label="Guardian name">
              <Input {...form.register("guardianName")} />
            </Field>
            <Field label="Guardian phone">
              <Input {...form.register("guardianPhone")} />
            </Field>
          </div>
          <Field label="Address">
            <Textarea rows={2} {...form.register("address")} />
          </Field>
          <Field label="Class section" error={form.formState.errors.classSectionId?.message}>
            <Select
              value={form.watch("classSectionId")}
              onValueChange={(v) => form.setValue("classSectionId", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={sectionsQ.isLoading ? "Loading..." : "Select section"} />
              </SelectTrigger>
              <SelectContent>
                {(sectionsQ.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.className?.replace("_", " ")} - {s.sectionName}
                    {s.academicYearName ? ` (${s.academicYearName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton loading={mutation.isPending}>Admit student</SubmitButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
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
