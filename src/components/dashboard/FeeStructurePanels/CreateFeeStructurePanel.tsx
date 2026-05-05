import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { CLASS_OPTIONS } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";

const FEE_TYPES = ["TUITION", "TRANSPORT", "LIBRARY", "SPORTS", "OTHER"];
const FREQUENCIES = ["MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"];

const schema = z.object({
  className: z.string().min(1, "Class name is required"),
  academicYearId: z.string().min(1, "Academic year ID is required").refine((v) => !isNaN(Number(v)), "Must be a number"),
  feeType: z.string().min(1, "Fee type is required"),
  frequency: z.string().min(1, "Frequency is required"),
  amount: z.string().min(1, "Amount is required").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be a positive number"),
  description: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function CreateFeeStructurePanel() {
  const [response, setResponse] = useState<any>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      className: "",
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
        className: v.className,
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

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Create Fee Structure</h3>
            <p className="text-sm text-muted-foreground">Add a new fee structure for a class</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) => createMutation.mutate(v))}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="className">Class Name</Label>
                <Select
                  value={form.watch("className")}
                  onValueChange={(val) => form.setValue("className", val)}
                >
                  <SelectTrigger id="className">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.className && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.className.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="academicYearId">Academic Year ID</Label>
                <Input
                  id="academicYearId"
                  type="number"
                  placeholder="Enter academic year ID"
                  {...form.register("academicYearId")}
                />
                {form.formState.errors.academicYearId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.academicYearId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feeType">Fee Type</Label>
                <Select
                  value={form.watch("feeType")}
                  onValueChange={(val) => form.setValue("feeType", val)}
                >
                  <SelectTrigger id="feeType">
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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

              <div className="space-y-1.5">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={form.watch("frequency")}
                  onValueChange={(val) => form.setValue("frequency", val)}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
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

            <div className="space-y-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                {...form.register("description")}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <SubmitButton
                loading={createMutation.isPending}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Create Fee Structure
              </SubmitButton>
            </div>
          </form>
        </div>
      </Card>

      {response && (
        <Card className="p-4 bg-muted">
          <h4 className="font-semibold mb-2">Response:</h4>
          <pre className="text-xs overflow-auto max-h-64 p-3 bg-background rounded border">
            {JSON.stringify(response, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
