import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SubmitButton from "@/components/common/SubmitButton";

import { getClassSubjectById } from "@/lib/api/classSubjects";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  id: z.string().min(1, "ID is required").refine((val) => !isNaN(Number(val)), "ID must be a number"),
});
type Values = z.infer<typeof schema>;

export function GetMappingPanel() {
  const [response, setResponse] = useState<any>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { id: "" },
  });

  const getMutation = useMutation({
    mutationFn: (id: string) => getClassSubjectById(Number(id)),
    onSuccess: (data) => {
      toast.success("Mapping retrieved successfully");
      setResponse(data);
    },
    onError: (err) => {
      const errorMsg = getApiErrorMessage(err, "Failed to retrieve mapping");
      toast.error(errorMsg);
      setResponse({ error: errorMsg });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Get Mapping by ID</h3>
            <p className="text-sm text-muted-foreground">Retrieve a specific class-subject mapping</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) =>
              getMutation.mutate(v.id)
            )}
          >
            <div className="space-y-1.5">
              <Label htmlFor="id">Mapping ID</Label>
              <Input
                id="id"
                type="number"
                placeholder="Enter mapping ID"
                {...form.register("id")}
              />
              {form.formState.errors.id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.id.message}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <SubmitButton
                loading={getMutation.isPending}
                className="gap-2"
              >
                <Search className="h-4 w-4" /> Get Mapping
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
