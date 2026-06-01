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
      <DialogContent className="sm:max-w-[480px] bg-white text-gray-900 border border-gray-200">
        <DialogTitle className="text-lg font-bold text-gray-900">
  New Exam Type Category
</DialogTitle>
<p className="text-sm text-gray-500 mt-1">Define a new exam type category for the institution.</p>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-bold text-gray-800">Code (Unique Matrix Tracking Key)</Label>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs border border-gray-300 text-gray-700 rounded-lg px-5">
            Cancel
          </Button>
          <Button onClick={() => handleCreate()} disabled={isPending || !name || !code} className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5">
            {isPending ? "Saving..." : "Save Category Blueprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}