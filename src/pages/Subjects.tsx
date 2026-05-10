// src/pages/Subjects.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
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
} from "@/lib/api/subjects";
import { getApiErrorMessage } from "@/lib/api/client";

import "@/styles/master-data.css";

const ITEMS_PER_PAGE = 10;

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .transform((v) => v.toUpperCase()),
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
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to create subject")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      toast.success("Subject deleted");
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
                <TableHead style={{ textAlign: "right" }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectsQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[40, 160, 80, 80].map((w, j) => (
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
                  <TableCell colSpan={4}>
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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Subject</DialogTitle>
            <DialogDescription>
              Add a subject to the curriculum.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) =>
              createMutation.mutate(
                v as Parameters<typeof createSubject>[0]
              )
            )}
          >
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="Mathematics" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input
                placeholder="MATH"
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

      {/* ── View Subject Dialog ───────────────────────────── */}
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
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  Name
                </div>
                <div className="font-medium">{viewQ.data.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  Code
                </div>
                <span className="md-badge md-badge--code">
                  {viewQ.data.code}
                </span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  ID
                </div>
                <div className="md-cell-mono break-all">{viewQ.data.id}</div>
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
              This action cannot be undone. The subject will be permanently
              removed.
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