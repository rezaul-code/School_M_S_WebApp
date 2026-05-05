import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/common/SubmitButton";

import {
  createClassSubject,
} from "@/lib/api/classSubjects";
import { listSubjects } from "@/lib/api/subjects";
import { CLASS_OPTIONS } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  className: z.string().min(1, "Class name is required"),
  subjectId: z.string().min(1, "Subject is required"),
});
type Values = z.infer<typeof schema>;

export function CreateMappingPanel() {
  const [response, setResponse] = useState<any>(null);

  const subjectsQ = useQuery({
    queryKey: ["subjects"],
    queryFn: listSubjects,
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { className: "", subjectId: "" },
  });

  const createMutation = useMutation({
    mutationFn: createClassSubject,
    onSuccess: (data) => {
      toast.success("Class-Subject mapping created successfully");
      setResponse(data);
      form.reset();
    },
    onError: (err) => {
      const errorMsg = getApiErrorMessage(err, "Failed to create mapping");
      toast.error(errorMsg);
      setResponse({ error: errorMsg });
    },
  });

  const subjects = subjectsQ.data ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Create Class-Subject Mapping</h3>
            <p className="text-sm text-muted-foreground">Add a new subject to a class</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) =>
              createMutation.mutate(v as Parameters<typeof createClassSubject>[0])
            )}
          >
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
              <Label htmlFor="subjectId">Subject</Label>
              <Select
                value={form.watch("subjectId")}
                onValueChange={(val) => form.setValue("subjectId", val)}
              >
                <SelectTrigger id="subjectId">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.subjectId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.subjectId.message}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <SubmitButton
                loading={createMutation.isPending}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Create Mapping
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
