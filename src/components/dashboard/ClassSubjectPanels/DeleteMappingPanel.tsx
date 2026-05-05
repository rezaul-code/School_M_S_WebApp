import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SubmitButton from "@/components/common/SubmitButton";

import { deleteClassSubject } from "@/lib/api/classSubjects";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  id: z.string().min(1, "ID is required").refine((val) => !isNaN(Number(val)), "ID must be a number"),
});
type Values = z.infer<typeof schema>;

export function DeleteMappingPanel() {
  const qc = useQueryClient();
  const [response, setResponse] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { id: "" },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClassSubject(Number(id)),
    onSuccess: (data) => {
      toast.success("Mapping deleted successfully");
      setResponse(data);
      qc.invalidateQueries({ queryKey: ["classSubjectMappings"] });
      form.reset();
      setConfirmOpen(false);
      setPendingId(null);
    },
    onError: (err) => {
      const errorMsg = getApiErrorMessage(err, "Failed to delete mapping");
      toast.error(errorMsg);
      setResponse({ error: errorMsg });
      setConfirmOpen(false);
      setPendingId(null);
    },
  });

  const handleSubmit = form.handleSubmit((v) => {
    setPendingId(v.id);
    setConfirmOpen(true);
  });

  const handleConfirmDelete = () => {
    if (pendingId) {
      deleteMutation.mutate(pendingId);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Delete Mapping by ID</h3>
            <p className="text-sm text-destructive">
              This action cannot be undone
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="id">Mapping ID</Label>
              <Input
                id="id"
                type="number"
                placeholder="Enter mapping ID to delete"
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
                loading={deleteMutation.isPending}
                className="gap-2 bg-destructive hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4" /> Delete Mapping
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the mapping with ID <span className="font-mono font-semibold">{pendingId}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
