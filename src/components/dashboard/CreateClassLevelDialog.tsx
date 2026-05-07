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
import { createClassLevel } from "../../lib/api/master";
import { getApiErrorMessage } from "../../lib/api/client";

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .regex(/^CLASS_\d+$/, 'Name must be in format "CLASS_X" (e.g., CLASS_1, CLASS_3)'),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .regex(
      /^CLASS_[A-Z]+$/,
      'Display name must be in format "CLASS_WORD" (e.g., CLASS_ONE, CLASS_THREE)'
    ),
});

type Values = z.infer<typeof schema>;

export interface CreateClassLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClassLevelDialog({
  open,
  onOpenChange,
}: CreateClassLevelDialogProps) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", displayName: "" },
  });

  const mutation = useMutation({
    mutationFn: createClassLevel,
    onSuccess: () => {
      toast.success("Class level created successfully");
      qc.invalidateQueries({ queryKey: ["class-levels-options"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => {
      console.error("Creation Error:", err);
      toast.error(getApiErrorMessage(err, "Failed to create class level"));
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
          <DialogTitle>Create Class Level</DialogTitle>
          <DialogDescription>
            Add a new class level to your school (e.g., CLASS_1, CLASS_3, CLASS_12).
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="cl-name">Name</Label>
            <Input
              id="cl-name"
              placeholder="e.g., CLASS_1, CLASS_3, CLASS_12"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cl-display">Display Name</Label>
            <Input
              id="cl-display"
              placeholder="e.g., CLASS_ONE, CLASS_THREE, CLASS_TWELVE"
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
            <SubmitButton loading={mutation.isPending}>Create Level</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}