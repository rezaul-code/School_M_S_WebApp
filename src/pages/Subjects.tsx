import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Eye, Plus, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import SubmitButton from "@/components/common/SubmitButton";
import EmptyState from "@/components/common/EmptyState";
import LoadingTable from "@/components/common/LoadingTable";

import { createSubject, deleteSubject, getSubject, listSubjects } from "@/lib/api/subjects";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").transform((v) => v.toUpperCase()),
});
type Values = z.infer<typeof schema>;

export default function Subjects() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const subjectsQ = useQuery({ queryKey: ["subjects"], queryFn: listSubjects });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "" },
  });

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      toast.success("Subject created");
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      setCreateOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to create subject")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      toast.success("Subject deleted");
      qc.invalidateQueries({ queryKey: ["subjects"] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to delete")),
  });

  const viewQ = useQuery({
    queryKey: ["subject", viewId],
    queryFn: () => getSubject(viewId as string),
    enabled: !!viewId,
  });

  const subjects = subjectsQ.data ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          {subjectsQ.data ? `${subjects.length} subject${subjects.length === 1 ? "" : "s"}` : "Loading..."}
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create Subject</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Subject</DialogTitle>
              <DialogDescription>Add a subject to the curriculum.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((v) => createMutation.mutate(v as Parameters<typeof createSubject>[0]))}
            >
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="Mathematics" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input
                  placeholder="MATH"
                  {...form.register("code")}
                  onChange={(e) => form.setValue("code", e.target.value.toUpperCase(), { shouldValidate: true })}
                  value={form.watch("code")}
                />
                {form.formState.errors.code && <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <SubmitButton loading={createMutation.isPending}>Create</SubmitButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Card>

      <Card className="p-4">
        {subjectsQ.isLoading ? (
          <LoadingTable cols={4} />
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No subjects yet"
            description="Create your first subject to build the curriculum."
            action={<Button className="gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create Subject</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{String(s.id).slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                        {s.code}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewId(s.id)}>
                        <Eye className="h-4 w-4" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
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

      {/* View subject */}
      <Dialog open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Subject Details</DialogTitle>
          </DialogHeader>
          {viewQ.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ) : viewQ.data ? (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground uppercase">Name</div>
                <div className="font-medium">{viewQ.data.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase">Code</div>
                <div className="font-medium font-mono">{viewQ.data.code}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase">ID</div>
                <div className="font-mono text-xs break-all">{viewQ.data.id}</div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The subject will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
