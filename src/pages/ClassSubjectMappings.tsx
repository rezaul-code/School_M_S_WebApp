import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link2, Plus, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  createClassSubject,
  deleteClassSubject,
  getAllClassSubjects,
} from "@/lib/api/classSubjects";
import { listSubjects } from "@/lib/api/subjects";
import { CLASS_OPTIONS } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  className: z.string().min(1, "Class name is required"),
  subjectId: z.string().min(1, "Subject is required"),
});
type Values = z.infer<typeof schema>;

export default function ClassSubjectMappings() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const mappingsQ = useQuery({
    queryKey: ["classSubjectMappings"],
    queryFn: getAllClassSubjects,
  });

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
    onSuccess: () => {
      toast.success("Class-Subject mapping created");
      qc.invalidateQueries({ queryKey: ["classSubjectMappings"] });
      form.reset();
      setCreateOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to create mapping")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClassSubject,
    onSuccess: () => {
      toast.success("Mapping deleted");
      qc.invalidateQueries({ queryKey: ["classSubjectMappings"] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to delete")),
  });

  const mappings = mappingsQ.data ?? [];
  const subjects = subjectsQ.data ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="h-4 w-4" />
          {mappingsQ.data
            ? `${mappings.length} mapping${mappings.length === 1 ? "" : "s"}`
            : "Loading..."}
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Class-Subject Mapping</DialogTitle>
              <DialogDescription>
                Map a subject to a class.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((v) =>
                createMutation.mutate(v as Parameters<typeof createClassSubject>[0])
              )}
            >
              <div className="space-y-1.5">
                <Label>Class Name</Label>
                <Select value={form.watch("className")} onValueChange={(val) => form.setValue("className", val)}>
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
                {form.formState.errors.className && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.className.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={form.watch("subjectId")} onValueChange={(val) => form.setValue("subjectId", val)}>
                  <SelectTrigger>
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <SubmitButton loading={createMutation.isPending}>
                  Add
                </SubmitButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Card>

      <Card className="p-4">
        {mappingsQ.isLoading ? (
          <LoadingTable cols={4} />
        ) : mappings.length === 0 ? (
          <EmptyState
            title="No mappings yet"
            description="Add your first class-subject mapping."
            action={
              <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Add Mapping
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {String(m.id).slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">{m.className}</TableCell>
                    <TableCell>{m.subject?.name || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(m.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
