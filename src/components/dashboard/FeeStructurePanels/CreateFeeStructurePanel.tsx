// src/components/dashboard/FeeStructurePanels/CreateFeeStructurePanel.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/common/SubmitButton";

import { createFeeStructure } from "@/lib/api/feeStructures";
import { getClassLevelOptions, listAcademicYears } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";
import { getDropdownOptions } from "@/lib/api/options";

const schema = z.object({
  classLevelId:   z.string().min(1, "Class is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  feeType:        z.string().min(1, "Fee type is required"),
  frequency:      z.string().min(1, "Frequency is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) > 0,
      "Amount must be greater than 0"
    ),
  description: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface Props {
  onSuccess?: () => void;
}

export function CreateFeeStructurePanel({ onSuccess }: Props) {
  const [response, setResponse] = useState<any>(null);

  const classesQuery       = useQuery({ queryKey: ["create-fee-classes"],      queryFn: getClassLevelOptions });
  const academicYearsQuery = useQuery({ queryKey: ["create-fee-years"],        queryFn: listAcademicYears });
  const feeTypesQuery      = useQuery({ queryKey: ["create-fee-types"],        queryFn: () => getDropdownOptions("fee-types") });
  const frequenciesQuery   = useQuery({ queryKey: ["create-fee-frequencies"],  queryFn: () => getDropdownOptions("fee-frequencies") });

  const classes      = Array.isArray(classesQuery.data)       ? classesQuery.data       : [];
  const academicYears= Array.isArray(academicYearsQuery.data) ? academicYearsQuery.data : [];
  const feeTypes     = Array.isArray(feeTypesQuery.data)      ? feeTypesQuery.data      : [];
  const frequencies  = Array.isArray(frequenciesQuery.data)   ? frequenciesQuery.data   : [];

  const isLoading =
    classesQuery.isLoading ||
    academicYearsQuery.isLoading ||
    feeTypesQuery.isLoading ||
    frequenciesQuery.isLoading;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      classLevelId: "", academicYearId: "", feeType: "",
      frequency: "", amount: "", description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: Values) =>
      createFeeStructure({
        classLevelId:   Number(values.classLevelId),
        academicYearId: Number(values.academicYearId),
        feeType:        values.feeType,
        frequency:      values.frequency,
        amount:         Number(values.amount),
        description:    values.description || undefined,
      }),
    onSuccess: (data) => {
      toast.success("Fee structure created successfully");
      setResponse(data);
      form.reset({ classLevelId: "", academicYearId: "", feeType: "", frequency: "", amount: "", description: "" });
      if (onSuccess) onSuccess(); // Triggers the view change in parent
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "Failed to create fee structure");
      toast.error(message);
      setResponse({ error: message });
    },
  });

  return (
    <div className="space-y-4 w-full">
      <div className="fs-form-section">
        <div className="fs-section-label">Fee Details</div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
        >
          <div className="fs-grid-2">
            {/* CLASS */}
            <div className="fs-field">
              <Label>Class</Label>
              <Select
                value={form.watch("classLevelId")}
                onValueChange={(value) => form.setValue("classLevelId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map((cls: any) => (
                      <SelectItem key={String(cls.id)} value={String(cls.id)}>
                        {cls.displayName || cls.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-classes" disabled>No classes available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.classLevelId && (
                <p className="fs-field-error">{form.formState.errors.classLevelId.message}</p>
              )}
            </div>

            {/* YEAR */}
            <div className="fs-field">
              <Label>Academic Year</Label>
              <Select
                value={form.watch("academicYearId")}
                onValueChange={(value) => form.setValue("academicYearId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.length > 0 ? (
                    academicYears.map((year: any) => (
                      <SelectItem key={String(year.id)} value={String(year.id)}>
                        {year.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-years" disabled>No academic years available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.academicYearId && (
                <p className="fs-field-error">{form.formState.errors.academicYearId.message}</p>
              )}
            </div>

            {/* FEE TYPE */}
            <div className="fs-field">
              <Label>Fee Type</Label>
              <Select
                value={form.watch("feeType")}
                onValueChange={(value) => form.setValue("feeType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fee type" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.length > 0 ? (
                    feeTypes.map((type: any, index: number) => (
                      <SelectItem key={`${type?.value || type}-${index}`} value={String(type?.value || type)}>
                        {type?.label || type?.value || type}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-fee-types" disabled>No fee types available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.feeType && (
                <p className="fs-field-error">{form.formState.errors.feeType.message}</p>
              )}
            </div>

            {/* FREQUENCY */}
            <div className="fs-field">
              <Label>Frequency</Label>
              <Select
                value={form.watch("frequency")}
                onValueChange={(value) => form.setValue("frequency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.length > 0 ? (
                    frequencies.map((freq: any, index: number) => (
                      <SelectItem key={`${freq?.value || freq}-${index}`} value={String(freq?.value || freq)}>
                        {freq?.label || freq?.value || freq}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-frequencies" disabled>No frequencies available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.frequency && (
                <p className="fs-field-error">{form.formState.errors.frequency.message}</p>
              )}
            </div>

            {/* AMOUNT */}
            <div className="fs-field">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="fs-field-error">{form.formState.errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="fs-field">
            <Label>Description</Label>
            <Textarea
              rows={3}
              placeholder="Optional description"
              {...form.register("description")}
            />
          </div>

          <div className="fs-form-footer">
            <SubmitButton
              loading={createMutation.isPending || isLoading}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Fee Structure
            </SubmitButton>
          </div>
        </form>
      </div>

      {/* Response card */}
      {response && (
        <div className={`fs-response-card ${response.error ? "fs-response-card--error" : ""}`}>
          <div className={`fs-response-header ${response.error ? "fs-response-header--error" : ""}`}>
            <p className={`fs-response-title ${response.error ? "fs-response-title--error" : ""}`}>
              {response.error ? "Error" : "Response"}
            </p>
          </div>
          <div className="fs-response-body">
            <pre className="fs-response-pre">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}