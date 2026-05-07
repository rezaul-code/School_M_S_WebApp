import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
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
import { 
  getClassLevelOptions, 
  listAcademicYears 
} from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";
import { getDropdownOptions } from "@/lib/api/options";

const schema = z.object({
  classLevelId: z.string().min(1, "Class is required").refine((v) => !isNaN(Number(v)), "Must be a number"),
  academicYearId: z.string().min(1, "Academic year is required").refine((v) => !isNaN(Number(v)), "Must be a number"),
  feeType: z.string().min(1, "Fee type is required"),
  frequency: z.string().min(1, "Frequency is required"),
  amount: z.string().min(1, "Amount is required").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be a positive number"),
  description: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function CreateFeeStructurePanel() {
  const [response, setResponse] = useState<any>(null);

  // Fetch dropdown options
  const classesQuery = useQuery({
    queryKey: ["class-levels"],
    queryFn: getClassLevelOptions,
  });

  const academicYearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: listAcademicYears,
  });

  const feeTypesQuery = useQuery({
    queryKey: ["fee-types"],
    queryFn: () => getDropdownOptions("fee-types"),
  });

  const frequenciesQuery = useQuery({
    queryKey: ["fee-frequencies"],
    queryFn: () => getDropdownOptions("fee-frequencies"),
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      classLevelId: "",
      academicYearId: "",
      feeType: "",
      frequency: "",
      amount: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (v: Values) =>
      createFeeStructure({
        classLevelId: Number(v.classLevelId),
        academicYearId: Number(v.academicYearId),
        feeType: v.feeType,
        frequency: v.frequency,
        amount: Number(v.amount),
        description: v.description || undefined,
      }),
    onSuccess: (data) => {
      toast.success("Fee Structure created successfully");
      setResponse(data);
      form.reset();
    },
    onError: (err) => {
      const errorMsg = getApiErrorMessage(err, "Failed to create fee structure");
      toast.error(errorMsg);
      setResponse({ error: errorMsg });
    },
  });

  const isLoading = 
    classesQuery.isLoading || 
    academicYearsQuery.isLoading || 
    feeTypesQuery.isLoading || 
    frequenciesQuery.isLoading;

  const classes = classesQuery.data ?? [];
  const academicYears = academicYearsQuery.data ?? [];
  const feeTypes = feeTypesQuery.data ?? [];
  const frequencies = frequenciesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Create Fee Structure</h3>
            <p className="text-sm text-muted-foreground">Add a new fee structure for a class and academic year</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) => createMutation.mutate(v))}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class Level Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="classLevelId">Class</Label>
                <Select
                  value={form.watch("classLevelId")}
                  onValueChange={(val) => form.setValue("classLevelId", val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="classLevelId">
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.displayName || cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.classLevelId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.classLevelId.message}
                  </p>
                )}
              </div>

              {/* Academic Year Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="academicYearId">Academic Year</Label>
                <Select
                  value={form.watch("academicYearId")}
                  onValueChange={(val) => form.setValue("academicYearId", val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="academicYearId">
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select academic year"} />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={String(year.id)}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.academicYearId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.academicYearId.message}
                  </p>
                )}
              </div>

              {/* Fee Type Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="feeType">Fee Type</Label>
                <Select
                  value={form.watch("feeType")}
                  onValueChange={(val) => form.setValue("feeType", val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="feeType">
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select fee type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.feeType && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.feeType.message}
                  </p>
                )}
              </div>

              {/* Frequency Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={form.watch("frequency")}
                  onValueChange={(val) => form.setValue("frequency", val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select frequency"} />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq.id} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.frequency && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.frequency.message}
                  </p>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  {...form.register("amount")}
                />
                {form.formState.errors.amount && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                {...form.register("description")}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <SubmitButton
                loading={createMutation.isPending || isLoading}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Create Fee Structure
              </SubmitButton>
            </div>
          </form>
        </div>
      </Card>

      {/* Response Display */}
      {response && (
        <Card className={`p-4 ${response.error ? "border-destructive bg-destructive/5" : "bg-muted"}`}>
          <h4 className={`font-semibold mb-2 ${response.error ? "text-destructive" : ""}`}>
            {response.error ? "Error:" : "Response:"}
          </h4>
          <pre className="text-xs overflow-auto max-h-64 p-3 bg-background rounded border">
            {JSON.stringify(response, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}