import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import SubmitButton from "../common/SubmitButton";
import { createSection } from "../../lib/api/master";
import { getApiErrorMessage } from "../../lib/api/client";

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .regex(/^[A-Z]+$/, 'Name must contain only uppercase letters (e.g., SUN, STAR, MOON)'),
  displayName: z
    .string()
    .min(1, "Display name is required"),
});

type Values = z.infer<typeof schema>;

export interface CreateSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateSectionDialog({
  open,
  onOpenChange,
}: CreateSectionDialogProps) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", displayName: "" },
  });

  const mutation = useMutation({
    mutationFn: createSection,
    onSuccess: () => {
      toast.success("Section created successfully");
      qc.invalidateQueries({ queryKey: ["sections-options"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => {
      console.error("Creation Error:", err);
      toast.error(getApiErrorMessage(err, "Failed to create section"));
    },
  });

  const onSubmit = (data: Values) => {
    mutation.mutate({
      name: data.name,
      displayName: data.displayName,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Section</DialogTitle>
          <DialogDescription>
            Add a new section to your school (e.g., SUN, STAR, MOON).
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="sec-name">Name</Label>
            <Input
              id="sec-name"
              placeholder="e.g., SUN, STAR, MOON"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sec-display">Display Name</Label>
            <Input
              id="sec-display"
              placeholder="e.g., SUN A, STAR B, MOON C"
              {...form.register("displayName")}
            />
            {form.formState.errors.displayName && (
              <p className="text-xs text-destructive">
                {form.formState.errors.displayName.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton loading={mutation.isPending}>Create Section</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}