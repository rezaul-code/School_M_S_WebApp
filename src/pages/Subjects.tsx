import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Eye,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Hash,
  ListFilter,
  Layers,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import Pagination from "@/components/common/Pagination";
import SubmitButton from "@/components/common/SubmitButton";

import {
  createSubject,
  deleteSubject,
  getSubject,
  listSubjects,
  type CreateSubjectPayload,
} from "@/lib/api/subjects";
import { getApiErrorMessage } from "@/lib/api/client";

import "@/styles/master-data.css";

const ITEMS_PER_PAGE = 10;

// Upgraded Zod validation to fully handle components
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .transform((v) => v.toUpperCase()),
  components: z
    .array(
      z.object({
        name: z.string().min(1, "Component name is required"),
        code: z
          .string()
          .min(1, "Component code is required")
          .transform((v) => v.toUpperCase()),
        displayOrder: z.number().int().min(1),
      })
    )
    .min(1, "At least one evaluation component is required"),
});
type Values = z.infer<typeof schema>;

export default function Subjects() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const subjectsQ = useQuery({ queryKey: ["subjects"], queryFn: listSubjects });

  // Instantiating react-hook-form with default structural values
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      components: [{ name: "Theory", code: "THEORY", displayOrder: 1 }],
    },
  });

  // field-array engine manages dynamic additions and subtractions of inputs
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      toast.success("Subject created successfully.");
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset({
        name: "",
        code: "",
        components: [{ name: "Theory", code: "THEORY", displayOrder: 1 }],
      });
      setCreateOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to create subject")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      toast.success("Subject deleted successfully.");
      qc.invalidateQueries({ queryKey: ["subjects"] });
      setDeleteId(null);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to delete")),
  });

  const viewQ = useQuery({
    queryKey: ["subject", viewId],
    queryFn: () => getSubject(viewId as string),
    enabled: !!viewId,
  });

  const subjects = subjectsQ.data ?? [];

  const filtered = subjects.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div className="md-page">
      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="md-hero md-hero--subjects">
        <div className="md-hero-glow" />
        <div className="md-hero-inner">
          <div className="md-hero-left">
            <div className="md-hero-icon-wrap">
              <BookOpen />
            </div>
            <div className="md-hero-text">
              <h2 className="md-hero-title">Subjects</h2>
              <p className="md-hero-sub">
                Define and manage subjects for the curriculum
              </p>
            </div>
          </div>
          <span className="md-hero-badge">
            <Sparkles />
            Master Data
          </span>
        </div>
      </div>

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div className="md-stats">
        <div className="md-stat md-stat--rose">
          <div className="md-stat-icon">
            <BookOpen />
          </div>
          <div>
            <div className="md-stat-label">Total Subjects</div>
            <div className="md-stat-value">
              {subjectsQ.isLoading ? "—" : subjects.length}
            </div>
          </div>
        </div>
        <div className="md-stat md-stat--blue">
          <div className="md-stat-icon">
            <ListFilter />
          </div>
          <div>
            <div className="md-stat-label">Showing</div>
            <div className="md-stat-value">
              {subjectsQ.isLoading ? "—" : filtered.length}
            </div>
          </div>
        </div>
        <div className="md-stat md-stat--violet">
          <div className="md-stat-icon">
            <Hash />
          </div>
          <div>
            <div className="md-stat-label">Unique Codes</div>
            <div className="md-stat-value">
              {subjectsQ.isLoading
                ? "—"
                : new Set(subjects.map((s) => s.code)).size}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="md-toolbar">
        <div className="md-toolbar-left">
          <div className="md-search-wrap">
            <Search className="md-search-icon" />
            <Input
              placeholder="Search subjects…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="h-9"
            />
          </div>
        </div>
        <div className="md-toolbar-right">
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 h-9 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Subject
          </Button>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────── */}
      <div className="md-card">
        <div className="md-card-header md-card-header--rose">
          <div className="md-card-title-group">
            <p className="md-card-title">Subject Registry</p>
            <p className="md-card-subtitle">
              {subjectsQ.isLoading
                ? "Loading…"
                : `${filtered.length} subject${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="md-table-wrap">
          <Table className="md-table">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Components Blueprint</TableHead>
                <TableHead style={{ textAlign: "right" }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectsQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[40, 160, 80, 120, 80].map((w, j) => (
                      <TableCell key={j}>
                        <div
                          className="md-skel"
                          style={{ height: "14px", width: `${w}px` }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="md-empty">
                      <BookOpen className="md-empty-icon" />
                      <p className="md-empty-title">
                        {search ? "No results found" : "No subjects yet"}
                      </p>
                      <p className="md-empty-desc">
                        {search
                          ? "Try a different search term."
                          : "Create your first subject to build the curriculum."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((s, idx) => (
                  <TableRow key={s.id}>
                    <TableCell className="md-cell-index">
                      {startIdx + idx + 1}
                    </TableCell>
                    <TableCell className="md-cell-name">{s.name}</TableCell>
                    <TableCell>
                      <span className="md-badge md-badge--code">{s.code}</span>
                    </TableCell>
                    {/* Render standard evaluation bubbles inside data row */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {s.components?.map((c: any) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border"
                          >
                            {c.name} ({c.code})
                          </span>
                        )) || (
                          <span className="text-xs text-muted-foreground italic">
                            No components defined
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="md-row-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 h-8 text-xs"
                          onClick={() => setViewId(String(s.id))}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(String(s.id))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!subjectsQ.isLoading && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        )}
      </div>

      {/* ── Create Subject Dialog ─────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            form.reset({
              name: "",
              code: "",
              components: [{ name: "Theory", code: "THEORY", displayOrder: 1 }],
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Subject</DialogTitle>
            <DialogDescription>
              Add a subject to the curriculum with its evaluation breakdown.
            </DialogDescription>
          </DialogHeader>
         <form
  className="space-y-4"
  onSubmit={form.handleSubmit((v) => {
    // Cast directly to the payload format
    createMutation.mutate(v as CreateSubjectPayload);
  })}
>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="Chemistry" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input
                placeholder="CHEM101"
                {...form.register("code")}
                onChange={(e) =>
                  form.setValue("code", e.target.value.toUpperCase(), {
                    shouldValidate: true,
                  })
                }
                value={form.watch("code")}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>

            {/* Sub-Layout: Dynamic Component Builder Section */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Structure Components
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() =>
                    append({
                      name: "",
                      code: "",
                      displayOrder: fields.length + 1,
                    })
                  }
                >
                  <Plus className="h-3 w-3" />
                  Add Row
                </Button>
              </div>

              {form.formState.errors.components?.message && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.components.message}
                </p>
              )}

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 bg-muted/40 p-2.5 rounded-lg border border-border relative group"
                  >
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="space-y-1">
                        <Input
                          placeholder="e.g. Practical Lab"
                          className="h-8 text-xs"
                          {...form.register(`components.${index}.name` as const)}
                        />
                        {form.formState.errors.components?.[index]?.name && (
                          <p className="text-[10px] text-destructive">
                            {form.formState.errors.components[index]?.name?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Input
                          placeholder="e.g. LAB"
                          className="h-8 text-xs"
                          {...form.register(`components.${index}.code` as const)}
                          onChange={(e) =>
                            form.setValue(
                              `components.${index}.code` as const,
                              e.target.value.toUpperCase(),
                              { shouldValidate: true }
                            )
                          }
                        />
                        {form.formState.errors.components?.[index]?.code && (
                          <p className="text-[10px] text-destructive">
                            {form.formState.errors.components[index]?.code?.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => remove(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
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

      {/* ── View Subject Dialog ───────────────────────────── */}
      <Dialog open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subject Details</DialogTitle>
          </DialogHeader>
          {viewQ.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : viewQ.data ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    Name
                  </div>
                  <div className="font-medium text-base text-foreground">
                    {viewQ.data.name}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    Code
                  </div>
                  <div>
                    <span className="md-badge md-badge--code text-sm">
                      {viewQ.data.code}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Evaluation Blueprint Components
                </div>
                <div className="bg-muted/30 border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-8 text-xs py-1">Order</TableHead>
                        <TableHead className="h-8 text-xs py-1">Component</TableHead>
                        <TableHead className="h-8 text-xs py-1">Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewQ.data.components?.map((c: any, index: number) => (
                        <TableRow key={c.id} className="hover:bg-transparent">
                          <TableCell className="py-1.5 font-mono text-xs">
                            {c.displayOrder ?? index + 1}
                          </TableCell>
                          <TableCell className="py-1.5 font-medium text-xs">
                            {c.name}
                          </TableCell>
                          <TableCell className="py-1.5.5">
                            <span className="px-1.5 py-0.5 font-mono rounded text-[10px] bg-secondary text-secondary-foreground border border-border">
                              {c.code}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  Internal System Reference Key
                </div>
                <div className="md-cell-mono text-xs text-muted-foreground break-all bg-muted/40 p-2 rounded border border-border">
                  {viewQ.data.id}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────── */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The subject and all associated
              blueprint evaluation rows will be permanently destroyed.
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
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}