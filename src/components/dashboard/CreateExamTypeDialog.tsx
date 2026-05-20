// src/components/dashboard/CreateExamTypeDialog.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExamType } from "@/lib/api/exams";
import { getApiErrorMessage } from "@/lib/api/client";

interface CreateExamTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateExamTypeDialog({ open, onOpenChange }: CreateExamTypeDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("WRITTEN");
  const [description, setDescription] = useState("");

  const { mutate: handleCreate, isPending } = useMutation({
    mutationFn: () => createExamType({ name, code: code.toUpperCase().trim(), category, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examTypes"] });
      toast.success("Exam Type master category saved cleanly.");
      // Reset form variables
      setName("");
      setCode("");
      setCategory("WRITTEN");
      setDescription("");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to create Exam Type category."));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-sidebar text-sidebar-foreground border-sidebar-border/60">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-wide">
            New Exam Type Category
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-xs font-medium">Code (Unique Matrix Tracking Key)</Label>
            <Input
              id="code"
              placeholder="e.g., UNIT_TEST_1_W_26"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium">Display Name</Label>
            <Input
              id="name"
              placeholder="e.g., Unit Test 1 Written Examination"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs font-medium">Evaluation Structure Mode</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="h-9">
                <SelectValue placeholder="Select type format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WRITTEN">Written Paper</SelectItem>
                <SelectItem value="PRACTICAL">Laboratory Practical Evaluation</SelectItem>
                <SelectItem value="ORAL">Oral / Spoken Test</SelectItem>
                <SelectItem value="VIVA">Viva Voce Interactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter institutional purposes or reference rules..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-9 text-xs">
            Cancel
          </Button>
          <Button onClick={() => handleCreate()} disabled={isPending || !name || !code} className="h-9 text-xs">
            {isPending ? "Saving..." : "Save Category Blueprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}