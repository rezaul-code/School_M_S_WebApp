// src/components/dashboard/FeeStructurePanels/UpdateFeeStructurePanel.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Edit2, AlertCircle } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SubmitButton from "@/components/common/SubmitButton";

import { updateFeeStructure } from "@/lib/api/feeStructures";
import { getApiErrorMessage, TOKEN_KEY } from "@/lib/api/client";

const schema = z.object({
  id: z
    .string()
    .min(1, "ID is required")
    .refine((val) => !isNaN(Number(val)), "ID must be a number"),
  amount: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) > 0),
      "Amount must be a positive number"
    ),
  description: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function UpdateFeeStructurePanel() {
  const [response, setResponse] = useState<any>(null);
  const isAuthenticated = !!localStorage.getItem(TOKEN_KEY);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { id: "", amount: "", description: "" },
  });

  const updateMutation = useMutation({
    mutationFn: (v: Values) =>
      updateFeeStructure(Number(v.id), {
        amount:      v.amount      ? Number(v.amount) : undefined,
        description: v.description || undefined,
      }),
    onSuccess: (data) => {
      toast.success("Fee Structure updated successfully");
      setResponse(data);
      form.reset();
    },
    onError: (err) => {
      const errorMsg = getApiErrorMessage(err, "Failed to update fee structure");
      toast.error(errorMsg);
      setResponse({ error: errorMsg });
    },
  });

  return (
    <div className="space-y-4 w-full">
      {/* Auth alert */}
      {!isAuthenticated && (
        <div className="fs-auth-alert">
          <AlertCircle className="h-4 w-4" />
          <p>
            Authentication token missing. Please log in again to update fee structures.
          </p>
        </div>
      )}

      <div className="fs-form-section">
        <div className="fs-section-label">Update Details</div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))}
        >
          {/* Fee Structure ID */}
          <div className="fs-field">
            <Label htmlFor="id">Fee Structure ID</Label>
            <Input
              id="id"
              type="number"
              placeholder="Enter fee structure ID"
              {...form.register("id")}
            />
            {form.formState.errors.id && (
              <p className="fs-field-error">{form.formState.errors.id.message}</p>
            )}
          </div>

          <div className="fs-grid-2">
            {/* Amount */}
            <div className="fs-field">
              <Label htmlFor="amount">Amount (₹) — Optional</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter new amount"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="fs-field-error">{form.formState.errors.amount.message}</p>
              )}
              <p className="fs-field-hint">Leave empty to keep existing amount</p>
            </div>
          </div>

          {/* Description */}
          <div className="fs-field">
            <Label htmlFor="description">Description — Optional</Label>
            <Textarea
              id="description"
              placeholder="Enter new description"
              rows={3}
              {...form.register("description")}
            />
            <p className="fs-field-hint">Leave empty to keep existing description</p>
          </div>

          <div className="fs-form-footer">
            <SubmitButton loading={updateMutation.isPending} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Update Fee Structure
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