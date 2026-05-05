import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DollarSign, Plus, Edit2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/common/SubmitButton";
import EmptyState from "@/components/common/EmptyState";
import LoadingTable from "@/components/common/LoadingTable";

import {
  createFeeStructure,
  getAllFeeStructures,
  getFilteredFeeStructures,
  updateFeeStructure,
} from "@/lib/api/feeStructures";
import { listAcademicYears } from "@/lib/api/master";
import { CLASS_OPTIONS } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";
import type { FeeStructure } from "@/types/api";

const FEE_TYPES = ["TUITION", "TRANSPORT", "HOSTEL", "ACTIVITY", "EXAMINATION"];
const FREQUENCIES = ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"];

const createSchema = z.object({
  className: z.string().min(1, "Class name is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  feeType: z.string().min(1, "Fee type is required"),
  frequency: z.string().min(1, "Frequency is required"),
  amount: z.string().min(1, "Amount is required").refine((v) => Number(v) > 0, "Amount must be positive"),
  description: z.string().optional(),
});
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((v) => Number(v) > 0, "Amount must be positive"),
  description: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

export default function FeeStructures() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const feesQ = useQuery({
    queryKey: ["feeStructures", filterClass, filterYear],
    queryFn: () => {
      if (filterClass || filterYear) {
        return getFilteredFeeStructures({
          className: filterClass || undefined,
          academicYearId: filterYear || undefined,
        });
      }
      return getAllFeeStructures();
    },
  });

  const yearsQ = useQuery({
    queryKey: ["academicYears"],
    queryFn: listAcademicYears,
  });

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      className: "",
      academicYearId: "",
      feeType: "",
      frequency: "",
      amount: "",
      description: "",
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { amount: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: createFeeStructure,
    onSuccess: () => {
      toast.success("Fee structure created");
      qc.invalidateQueries({ queryKey: ["feeStructures"] });
      createForm.reset();
      setCreateOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to create fee structure")),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; amount: number; description?: string }) =>
      updateFeeStructure(id, payload),
    onSuccess: () => {
      toast.success("Fee structure updated");
      qc.invalidateQueries({ queryKey: ["feeStructures"] });
      editForm.reset();
      setEditId(null);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to update fee structure")),
  });

  const fees = feesQ.data ?? [];
  const years = yearsQ.data ?? [];

  const selectedFeeForEdit = editId
    ? fees.find((f) => f.id === editId)
    : null;

  const handleEditOpen = (fee: FeeStructure) => {
    setEditId(fee.id);
    editForm.reset({
      amount: String(fee.amount),
      description: fee.description || "",
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          {feesQ.data
            ? `${fees.length} fee structure${fees.length === 1 ? "" : "s"}`
            : "Loading..."}
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Fee Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Fee Structure</DialogTitle>
              <DialogDescription>
                Create a new fee structure for a class.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={createForm.handleSubmit((v) =>
                createMutation.mutate(v as Parameters<typeof createFeeStructure>[0])
              )}
            >
              <div className="space-y-1.5">
                <Label>Class Name</Label>
                <Select value={createForm.watch("className")} onValueChange={(val) => createForm.setValue("className", val)}>
                  <SelectTrigger>
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
                {createForm.formState.errors.className && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.className.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Select value={createForm.watch("academicYearId")} onValueChange={(val) => createForm.setValue("academicYearId", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y.id} value={String(y.id)}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.academicYearId && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.academicYearId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Fee Type</Label>
                <Select value={createForm.watch("feeType")} onValueChange={(val) => createForm.setValue("feeType", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.feeType && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.feeType.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={createForm.watch("frequency")} onValueChange={(val) => createForm.setValue("frequency", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.frequency && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.frequency.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  {...createForm.register("amount")}
                />
                {createForm.formState.errors.amount && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="Add notes about this fee..."
                  {...createForm.register("description")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <SubmitButton loading={createMutation.isPending}>
                  Create
                </SubmitButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Filter Card */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Filter by Class</Label>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All classes</SelectItem>
                {CLASS_OPTIONS.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Filter by Year</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {feesQ.isLoading ? (
          <LoadingTable cols={7} />
        ) : fees.length === 0 ? (
          <EmptyState
            title="No fee structures yet"
            description="Add your first fee structure."
            action={
              <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Add Fee Structure
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Class</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.className}</TableCell>
                    <TableCell>{f.academicYearId}</TableCell>
                    <TableCell>{f.feeType}</TableCell>
                    <TableCell>{f.frequency}</TableCell>
                    <TableCell className="font-semibold">₹{f.amount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {f.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleEditOpen(f)}
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Fee Structure</DialogTitle>
            <DialogDescription>
              {selectedFeeForEdit && (
                <>
                  {selectedFeeForEdit.className} - {selectedFeeForEdit.feeType}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedFeeForEdit && (
            <form
              className="space-y-4"
              onSubmit={editForm.handleSubmit((v) =>
                editMutation.mutate({
                  id: selectedFeeForEdit.id,
                  amount: Number(v.amount),
                  description: v.description,
                })
              )}
            >
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  {...editForm.register("amount")}
                />
                {editForm.formState.errors.amount && (
                  <p className="text-xs text-destructive">
                    {editForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="Add notes about this fee..."
                  {...editForm.register("description")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditId(null)}
                >
                  Cancel
                </Button>
                <SubmitButton loading={editMutation.isPending}>
                  Update
                </SubmitButton>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
