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
import { getClassLevelOptions, listAcademicYears } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";
import { getDropdownOptions } from "@/lib/api/options";

const schema = z.object({
classLevelId: z.string().min(1, "Class is required"),
academicYearId: z.string().min(1, "Academic year is required"),
feeType: z.string().min(1, "Fee type is required"),
frequency: z.string().min(1, "Frequency is required"),

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

export function CreateFeeStructurePanel() {
const [response, setResponse] = useState<any>(null);

const classesQuery = useQuery({
queryKey: ["create-fee-classes"],
queryFn: getClassLevelOptions,
});

const academicYearsQuery = useQuery({
queryKey: ["create-fee-years"],
queryFn: listAcademicYears,
});

const feeTypesQuery = useQuery({
queryKey: ["create-fee-types"],
queryFn: () => getDropdownOptions("fee-types"),
});

const frequenciesQuery = useQuery({
queryKey: ["create-fee-frequencies"],
queryFn: () => getDropdownOptions("fee-frequencies"),
});

const classes = Array.isArray(classesQuery.data)
? classesQuery.data
: [];

const academicYears = Array.isArray(academicYearsQuery.data)
? academicYearsQuery.data
: [];

const feeTypes = Array.isArray(feeTypesQuery.data)
? feeTypesQuery.data
: [];

const frequencies = Array.isArray(frequenciesQuery.data)
? frequenciesQuery.data
: [];

const isLoading =
classesQuery.isLoading ||
academicYearsQuery.isLoading ||
feeTypesQuery.isLoading ||
frequenciesQuery.isLoading;

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
mutationFn: async (values: Values) => {
return createFeeStructure({
classLevelId: Number(values.classLevelId),
academicYearId: Number(values.academicYearId),
feeType: values.feeType,
frequency: values.frequency,
amount: Number(values.amount),
description: values.description || undefined,
});
},

onSuccess: (data) => {
  toast.success("Fee structure created successfully");

  setResponse(data);

  form.reset({
    classLevelId: "",
    academicYearId: "",
    feeType: "",
    frequency: "",
    amount: "",
    description: "",
  });
},

onError: (error) => {
  const message = getApiErrorMessage(
    error,
    "Failed to create fee structure"
  );

  toast.error(message);

  setResponse({
    error: message,
  });
},


});

return ( <div className="space-y-4 w-full"> <Card className="p-6"> <div className="space-y-4"> <div> <h3 className="text-lg font-semibold">
Create Fee Structure </h3>


        <p className="text-sm text-muted-foreground">
          Add a new fee structure
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          createMutation.mutate(values)
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CLASS */}
          <div className="space-y-1.5">
            <Label>Class</Label>

            <Select
              value={form.watch("classLevelId")}
              onValueChange={(value) =>
                form.setValue("classLevelId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>

              <SelectContent>
                {classes.length > 0 ? (
                  classes.map((cls: any) => (
                    <SelectItem
                      key={String(cls.id)}
                      value={String(cls.id)}
                    >
                      {cls.displayName || cls.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem
                    value="no-classes"
                    disabled
                  >
                    No classes available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {form.formState.errors.classLevelId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.classLevelId.message}
              </p>
            )}
          </div>

          {/* YEAR */}
          <div className="space-y-1.5">
            <Label>Academic Year</Label>

            <Select
              value={form.watch("academicYearId")}
              onValueChange={(value) =>
                form.setValue("academicYearId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>

              <SelectContent>
                {academicYears.length > 0 ? (
                  academicYears.map((year: any) => (
                    <SelectItem
                      key={String(year.id)}
                      value={String(year.id)}
                    >
                      {year.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem
                    value="no-years"
                    disabled
                  >
                    No academic years available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {form.formState.errors.academicYearId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.academicYearId.message}
              </p>
            )}
          </div>

          {/* FEE TYPE */}
          <div className="space-y-1.5">
            <Label>Fee Type</Label>

            <Select
              value={form.watch("feeType")}
              onValueChange={(value) =>
                form.setValue("feeType", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fee type" />
              </SelectTrigger>

              <SelectContent>
                {feeTypes.length > 0 ? (
                  feeTypes.map((type: any, index: number) => (
                    <SelectItem
                      key={`${type?.value || type}-${index}`}
                      value={String(type?.value || type)}
                    >
                      {type?.label || type?.value || type}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem
                    value="no-fee-types"
                    disabled
                  >
                    No fee types available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {form.formState.errors.feeType && (
              <p className="text-xs text-destructive">
                {form.formState.errors.feeType.message}
              </p>
            )}
          </div>

          {/* FREQUENCY */}
          <div className="space-y-1.5">
            <Label>Frequency</Label>

            <Select
              value={form.watch("frequency")}
              onValueChange={(value) =>
                form.setValue("frequency", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>

              <SelectContent>
                {frequencies.length > 0 ? (
                  frequencies.map((freq: any, index: number) => (
                    <SelectItem
                      key={`${freq?.value || freq}-${index}`}
                      value={String(freq?.value || freq)}
                    >
                      {freq?.label || freq?.value || freq}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem
                    value="no-frequencies"
                    disabled
                  >
                    No frequencies available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {form.formState.errors.frequency && (
              <p className="text-xs text-destructive">
                {form.formState.errors.frequency.message}
              </p>
            )}
          </div>

          {/* AMOUNT */}
          <div className="space-y-1.5">
            <Label>Amount</Label>

            <Input
              type="number"
              step="0.01"
              min="0"
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

        {/* DESCRIPTION */}
        <div className="space-y-1.5">
          <Label>Description</Label>

          <Textarea
            rows={3}
            placeholder="Optional description"
            {...form.register("description")}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <SubmitButton
            loading={
              createMutation.isPending || isLoading
            }
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Fee Structure
          </SubmitButton>
        </div>
      </form>
    </div>
  </Card>

  {response && (
    <Card
      className={`p-4 ${
        response.error
          ? "border-destructive bg-destructive/5"
          : "bg-muted"
      }`}
    >
      <h4
        className={`font-semibold mb-2 ${
          response.error
            ? "text-destructive"
            : ""
        }`}
      >
        {response.error ? "Error" : "Response"}
      </h4>

      <pre className="text-xs overflow-auto max-h-64 p-3 bg-background rounded border">
        {JSON.stringify(response, null, 2)}
      </pre>
    </Card>
  )}
</div>

);
}
