import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Edit2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  // LOCAL STATE ONLY
  const [response, setResponse] = useState<any>(null);
  const isAuthenticated = !!localStorage.getItem(TOKEN_KEY);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: "",
      amount: "",
      description: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (v: Values) =>
      updateFeeStructure(Number(v.id), {
        amount: v.amount ? Number(v.amount) : undefined,
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
      {!isAuthenticated && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Authentication token missing. Please log in again to update fee structures.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Update Fee Structure</h3>
            <p className="text-sm text-muted-foreground">
              Update amount and description of an existing fee structure
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))}
          >
            {/* Fee Structure ID Input */}
            <div className="space-y-1.5">
              <Label htmlFor="id">Fee Structure ID</Label>
              <Input
                id="id"
                type="number"
                placeholder="Enter fee structure ID"
                {...form.register("id")}
              />
              {form.formState.errors.id && (
                <p className="text-xs text-destructive">{form.formState.errors.id.message}</p>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₹) (Optional)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter new amount"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Leave empty to keep existing amount</p>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter new description"
                {...form.register("description")}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to keep existing description
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <SubmitButton loading={updateMutation.isPending} className="gap-2">
                <Edit2 className="h-4 w-4" /> Update Fee Structure
              </SubmitButton>
            </div>
          </form>
        </div>
      </Card>

      {/* Response Display */}
      {response && (
        <Card className={`p-4 ${response.error ? "border-destructive bg-destructive/5" : "bg-muted"}`}>
          <h4
            className={`font-semibold mb-2 ${response.error ? "text-destructive" : ""}`}
          >
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