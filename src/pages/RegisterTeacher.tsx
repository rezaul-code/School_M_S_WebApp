// src/pages/RegisterTeacher.tsx

import { useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import SubmitButton from "@/components/common/SubmitButton";

import {
  registerTeacher,
  getGenderOptions,
  getReligionOptions,
  getBloodGroupOptions,
} from "@/lib/api/teachers";
import { getApiErrorMessage } from "@/lib/api/client";

import "@/styles/teacher.css";

// ── Types ────────────────────────────────────────────────────────────────────

// Blood group comes back as { value, label } objects; gender/religion as plain strings.
interface EnumOption {
  value: string;
  label: string;
}

// ── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  email:       z.string().email("Invalid email"),
  password:    z.string().min(8, "Password must be at least 8 characters"),
  firstName:   z.string().min(1, "First name required"),
  lastName:    z.string().min(1, "Last name required"),
  phone:       z.string().optional(),
  dateOfBirth: z.string().optional(),
  address:     z.string().optional(),
  joiningDate: z.string().optional(),
  gender:      z.string().optional(),
  religion:    z.string().optional(),
  bloodGroup:  z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function ErrorText({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="tm-field-error">{text}</p>;
}

// Handles both plain string[] (gender, religion) and EnumOption[] (blood group)
function SelectField({
  label,
  name,
  options,
  loading,
  register,
}: {
  label: string;
  name: keyof FormValues;
  options: string[] | EnumOption[];
  loading?: boolean;
  register: ReturnType<typeof useForm<FormValues>>["register"];
}) {
  return (
    <div className="tm-field">
      <Label>{label}</Label>
      <select
        {...register(name)}
        disabled={loading}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{loading ? "Loading…" : "— Select —"}</option>
        {(options as Array<string | EnumOption>).map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const label = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

// ── Page component ───────────────────────────────────────────────────────────

export default function RegisterTeacherPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ── Backend-driven enum options ──────────────────────────────────────────

  const { data: genderOptions = [], isLoading: gendersLoading } = useQuery({
    queryKey: ["options", "genders"],
    queryFn:  getGenderOptions,
    staleTime: Infinity,
  });

  const { data: religionOptions = [], isLoading: religionsLoading } = useQuery({
    queryKey: ["options", "religions"],
    queryFn:  getReligionOptions,
    staleTime: Infinity,
  });

  // Blood group returns EnumOption[] { value, label } from backend
  const { data: bloodGroupOptions = [], isLoading: bloodGroupsLoading } = useQuery<EnumOption[]>({
    queryKey: ["options", "blood-groups"],
    queryFn:  getBloodGroupOptions,
    staleTime: Infinity,
  });

  // ── Form ─────────────────────────────────────────────────────────────────

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "", password: "", firstName: "", lastName: "",
      phone: "", dateOfBirth: "", address: "", joiningDate: "",
      gender: "", religion: "", bloodGroup: "",
    },
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
        gender:      values.gender      || undefined,
        religion:    values.religion    || undefined,
        bloodGroup:  values.bloodGroup  || undefined,
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
      <div className="tm-form-card tm-form-card--wide">
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>

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

                <div className="tm-grid-2" style={{ marginTop: "1rem" }}>
                  <div className="tm-field">
                    <Label>Date of Birth</Label>
                    <Input type="date" {...form.register("dateOfBirth")} />
                  </div>
                  <SelectField
                    label="Gender"
                    name="gender"
                    options={genderOptions}
                    loading={gendersLoading}
                    register={form.register}
                  />
                </div>

                <div className="tm-grid-2" style={{ marginTop: "1rem" }}>
                  <SelectField
                    label="Religion"
                    name="religion"
                    options={religionOptions}
                    loading={religionsLoading}
                    register={form.register}
                  />
                  <SelectField
                    label="Blood Group"
                    name="bloodGroup"
                    options={bloodGroupOptions}
                    loading={bloodGroupsLoading}
                    register={form.register}
                  />
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