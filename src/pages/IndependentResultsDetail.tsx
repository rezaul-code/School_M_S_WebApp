// src/pages/IndependentResultsDetail.tsx
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import React from 'react';
import {
  ArrowLeft, Search, Download, CheckCircle2, XCircle,
  ChevronRight, ChevronDown, Info, AlertTriangle,
  CheckCheck, Lock, Edit3, Clock, RefreshCw,
} from "lucide-react";

import { ReportCardButton } from "@/components/print/ReportCardPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { getExamDetails } from "@/lib/api/exams";
import {
  getMarksByExamWithComponents,
  getPendingApprovalCount,
  approveMark,
  rejectMark,
  bulkApproveMarks,
  groupMarksByStudent,
  MarkStatus,
} from "@/lib/api/marks";
import { getCurrentUser } from "@/lib/api/auth";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  DRAFT:     { label: "Draft",     cls: "bg-amber-500/10 text-amber-600 border-amber-500/20",   icon: <Edit3 className="h-3 w-3" /> },
  SUBMITTED: { label: "Submitted", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20",      icon: <Clock className="h-3 w-3" /> },
  APPROVED:  { label: "Approved",  cls: "bg-green-500/10 text-green-600 border-green-500/20",   icon: <CheckCircle2 className="h-3 w-3" /> },
  LOCKED:    { label: "Locked",    cls: "bg-slate-500/10 text-slate-600 border-slate-500/20",   icon: <Lock className="h-3 w-3" /> },
  REJECTED:  { label: "Rejected",  cls: "bg-red-500/10 text-red-500 border-red-500/20",         icon: <XCircle className="h-3 w-3" /> },
  COMPLETED: { label: "Completed", cls: "bg-teal-500/10 text-teal-600 border-teal-500/20",      icon: <CheckCheck className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
      m.cls
    )}>
      {m.icon}{m.label}
    </span>
  );
}

function MarkBar({ obtained, max }: { obtained: number; max: number }) {
  const pct = max > 0 ? Math.round((obtained / max) * 100) : 0;
  const color = pct >= 75 ? "#639922" : pct >= 50 ? "#BA7517" : "#E24B4A";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-medium text-foreground">{obtained}</span>
      <span className="text-[11px] text-muted-foreground">/{max}</span>
      <div className="w-10 h-1 bg-border rounded-full overflow-hidden mt-0.5">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Reject dialog ────────────────────────────────────────────────────────────
interface RejectDialogProps {
  markId: number | null;
  onClose: () => void;
  onConfirm: (markId: number, reason: string) => void;
  loading: boolean;
}
function RejectDialog({ markId, onClose, onConfirm, loading }: RejectDialogProps) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={!!markId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject mark entry</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Provide a reason — the teacher will see this and can resubmit.
        </p>
        <Textarea
          placeholder="e.g. Marks exceed maximum for theory component."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[80px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || loading}
            onClick={() => markId && onConfirm(markId, reason)}
          >
            {loading ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function IndependentResultsDetail() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<MarkStatus | "">("");
  const [sortBy, setSortBy] = useState<"rank" | "name" | "roll" | "hi" | "lo">("rank");
  
  // NEW: Rank Mode State
  const [rankMode, setRankMode] = useState<"CLASS" | "SECTION">("CLASS"); 
  
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [rejectMarkId, setRejectMarkId] = useState<number | null>(null);

  const id = Number(examId);
  const user = (() => { try { return getCurrentUser(); } catch { return null; } })();
  const adminUserId = user?.id ?? "";

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: examDetail, isLoading: examLoading } = useQuery({
    queryKey: ["examDetail", id],
    queryFn: () => getExamDetails(id),
    enabled: !!id,
  });

  const { data: rawMarks = [], isLoading: marksLoading } = useQuery({
    queryKey: ["marksWithComponents", id],
    queryFn: () => getMarksByExamWithComponents(id),
    enabled: !!id,
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pendingCount", id],
    queryFn: () => getPendingApprovalCount(id),
    enabled: !!id,
  });

  // ─── Derived data ──────────────────────────────────────────────────────────
  const studentRows = useMemo(() => groupMarksByStudent(rawMarks), [rawMarks]);

  const subjectNames = useMemo(() => {
    const names = new Set<string>();
    rawMarks.forEach((m) => names.add(m.subjectName));
    return Array.from(names).sort();
  }, [rawMarks]);

  const sections = useMemo(() => {
    const s = new Set<string>();
    studentRows.forEach((r) => s.add(r.sectionName));
    return Array.from(s).sort();
  }, [studentRows]);

  // NEW: Dynamic Rank Engine (Handles both Class vs Section and Ties)
  const ranked = useMemo(() => {
    if (rankMode === "CLASS") {
      let currentRank = 1;
      let previousMarks = -1;
      
      return [...studentRows]
        .sort((a, b) => b.totalObtained - a.totalObtained)
        .map((r, i) => {
          if (r.totalObtained !== previousMarks) {
            currentRank = i + 1; // Standard dense ranking tie breaker
            previousMarks = r.totalObtained;
          }
          return { ...r, rank: currentRank };
        });
    } else {
      const sectionsMap: Record<string, typeof studentRows> = {};
      
      studentRows.forEach((r) => {
        const sec = r.sectionName || "Unassigned";
        if (!sectionsMap[sec]) sectionsMap[sec] = [];
        sectionsMap[sec].push(r);
      });

      const rankedBySection = Object.values(sectionsMap).flatMap((sectionGroup) => {
        let currentRank = 1;
        let previousMarks = -1;

        return [...sectionGroup]
          .sort((a, b) => b.totalObtained - a.totalObtained)
          .map((r, i) => {
            if (r.totalObtained !== previousMarks) {
              currentRank = i + 1;
              previousMarks = r.totalObtained;
            }
            return { ...r, rank: currentRank };
          });
      });

      return rankedBySection;
    }
  }, [studentRows, rankMode]);

  const displayRows = useMemo(() => {
    let rows = ranked;
    if (search)
      rows = rows.filter(
        (r) =>
          r.studentName.toLowerCase().includes(search.toLowerCase()) ||
          r.rollNumber.toLowerCase().includes(search.toLowerCase())
      );
    if (sectionFilter) rows = rows.filter((r) => r.sectionName === sectionFilter);
    if (statusFilter)  rows = rows.filter((r) => r.overallStatus === statusFilter);
    if (sortBy === "name") rows = [...rows].sort((a, b) => a.studentName.localeCompare(b.studentName));
    else if (sortBy === "roll") rows = [...rows].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
    else if (sortBy === "hi") rows = [...rows].sort((a, b) => b.totalObtained - a.totalObtained);
    else if (sortBy === "lo") rows = [...rows].sort((a, b) => a.totalObtained - b.totalObtained);
    else if (sortBy === "rank") rows = [...rows].sort((a, b) => (a as any).rank - (b as any).rank);
    return rows;
  }, [ranked, search, sectionFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    if (!ranked.length) return null;
    const totals = ranked.map((r) => r.totalObtained);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const approved = ranked.filter(
      (r) => r.overallStatus === "APPROVED" || r.overallStatus === "LOCKED"
    ).length;
    return {
      total: ranked.length,
      approved,
      pending: ranked.length - approved,
      avg: avg.toFixed(1),
      highest: Math.max(...totals),
      lowest: Math.min(...totals),
    };
  }, [ranked]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["marksWithComponents", id] });
    queryClient.invalidateQueries({ queryKey: ["pendingCount", id] });
  };

  const { mutate: doApprove, isPending: approving } = useMutation({
    mutationFn: (markId: number) => approveMark(markId, adminUserId),
    onSuccess: () => { toast.success("Mark approved."); invalidate(); },
    onError: () => toast.error("Failed to approve mark."),
  });

  const { mutate: doReject, isPending: rejecting } = useMutation({
    mutationFn: ({ markId, reason }: { markId: number; reason: string }) =>
      rejectMark(markId, reason, adminUserId),
    onSuccess: () => { toast.success("Mark rejected."); setRejectMarkId(null); invalidate(); },
    onError: () => toast.error("Failed to reject mark."),
  });

  const { mutate: doBulkApprove, isPending: bulkApproving } = useMutation({
    mutationFn: () => bulkApproveMarks(id, adminUserId),
    onSuccess: (res) => {
      toast.success(`${res.length} marks approved.`);
      invalidate();
    },
    onError: () => toast.error("Bulk approve failed."),
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function toggleExpand(enrollmentId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(enrollmentId) ? next.delete(enrollmentId) : next.add(enrollmentId);
      return next;
    });
  }

  function rankChip(rank: number) {
    const cls =
      rank === 1 ? "bg-amber-100 text-amber-800 border-amber-200"
      : rank === 2 ? "bg-slate-100 text-slate-700 border-slate-200"
      : rank === 3 ? "bg-orange-100 text-orange-700 border-orange-200"
      : "bg-muted text-muted-foreground border-border";
    return (
      <span className={cn("inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-[11px] font-semibold border", cls)}>
        {rank}
      </span>
    );
  }

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }

  const avatarColors = [
    "bg-blue-100 text-blue-800", "bg-green-100 text-green-800",
    "bg-amber-100 text-amber-800", "bg-purple-100 text-purple-800",
    "bg-teal-100 text-teal-800",
  ];

  const isLoading = examLoading || marksLoading;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="md-page">

      {/* Back + header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={() => navigate("/independent-results")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-lg font-semibold text-foreground leading-tight">
            {examDetail?.name ?? "Loading…"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {examDetail?.classLevelName} · {examDetail?.academicYearName} · Raw marks view
          </p>
        </div>
        {examDetail?.status && (
          <StatusBadge status={examDetail.status as MarkStatus} />
        )}
      </div>

      {/* Exam meta cards */}
      {examDetail && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: "Exam",     value: examDetail.name },
            { label: "Class",    value: examDetail.classLevelName },
            { label: "Year",     value: examDetail.academicYearName },
            { label: "Dates",    value: `${new Date(examDetail.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(examDetail.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` },
            { label: "Subjects", value: `${examDetail.subjects?.length ?? "—"} subjects` },
          ].map((m) => (
            <div key={m.label} className="bg-muted/50 rounded-lg px-3 py-2.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{m.label}</div>
              <div className="text-sm font-medium text-foreground">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Info notice */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-blue-500/8 border border-blue-500/20 text-blue-700 text-sm mb-5">
        <Info className="h-4 w-4 flex-shrink-0" />
        <span>Showing raw marks from <code className="text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">student_marks</code>. Annual result processing runs separately via Grade &amp; Rule Engine.</span>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: "Total students", value: stats.total,    sub: examDetail?.classLevelName },
            { label: "Marks approved", value: stats.approved, sub: `${stats.pending} pending` },
            { label: "Class average",  value: `${stats.avg}%`, sub: `out of ${displayRows[0]?.totalMax ?? "—"}` },
            { label: "Highest",        value: stats.highest,  sub: "marks" },
            { label: "Lowest",         value: stats.lowest,   sub: "marks" },
          ].map((s) => (
            <div key={s.label} className="bg-muted/40 rounded-lg px-3 py-2.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{s.label}</div>
              <div className="text-xl font-semibold text-foreground">{s.value}</div>
              {s.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Pending approval banner */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-amber-500/8 border border-amber-500/20 mb-5">
          <div className="flex items-center gap-2.5 text-amber-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              {pendingCount} mark {pendingCount === 1 ? "entry" : "entries"} pending approval
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => doBulkApprove()}
            disabled={bulkApproving}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
          >
            {bulkApproving ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Approving…</>
            ) : (
              <><CheckCheck className="h-3.5 w-3.5" /> Bulk approve all</>
            )}
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-[260px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or roll…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        
        {/* Rank Mode Filter */}
        <select
          value={rankMode}
          onChange={(e) => setRankMode(e.target.value as "CLASS" | "SECTION")}
          className="h-9 px-3 text-sm font-medium border border-blue-200 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <option value="CLASS">Rank Across Class</option>
          <option value="SECTION">Rank Within Section</option>
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground"
        >
          <option value="">All sections</option>
          {sections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MarkStatus | "")}
          className="h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground"
        >
          <option value="">All statuses</option>
          {(["APPROVED","SUBMITTED","DRAFT","LOCKED","REJECTED"] as MarkStatus[]).map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground"
        >
          <option value="rank">Sort: by rank</option>
          <option value="name">Sort: by name</option>
          <option value="roll">Sort: by roll no</option>
          <option value="hi">Sort: highest first</option>
          <option value="lo">Sort: lowest first</option>
        </select>
        
        <span className="text-xs text-muted-foreground ml-auto">
          {displayRows.length} student{displayRows.length !== 1 ? "s" : ""}
        </span>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Marks table */}
      <div className="md-card border border-border overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading marks…</div>
        ) : displayRows.length === 0 ? (
          <div className="md-empty">
            <Search className="md-empty-icon" />
            <p className="md-empty-title">No students match</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-48">Student</TableHead>
                <TableHead className="w-20 text-center">Section</TableHead>
                {subjectNames.map((name) => (
                  <TableHead key={name} className="text-center min-w-[90px]">
                    <div className="text-xs font-medium">{name}</div>
                  </TableHead>
                ))}
                <TableHead className="text-center w-24">Total</TableHead>
                <TableHead className="text-center w-14">Rank</TableHead>
                <TableHead className="text-center w-28">Status</TableHead>
                <TableHead className="text-center w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, rowIdx) => {
                const isExpanded = expanded.has(row.enrollmentId);
                const totalPct = row.totalMax > 0
                  ? ((row.totalObtained / row.totalMax) * 100).toFixed(1)
                  : "0";

                const allSubjectMarks = subjectNames
                  .map((n) => row.subjects[n])
                  .filter(Boolean);

                const hasSubmitted = allSubjectMarks.some((m) => m.status === "SUBMITTED");

                return (
                  <React.Fragment key={row.enrollmentId}>
                    <TableRow className="group">

                      {/* Expand toggle */}
                      <TableCell className="px-2">
                        <button
                          onClick={() => toggleExpand(row.enrollmentId)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          aria-label="Toggle components"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                      </TableCell>

                      {/* Student */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0",
                            avatarColors[rowIdx % avatarColors.length]
                          )}>
                            {getInitials(row.studentName)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground leading-tight">{row.studentName}</div>
                            <div className="text-[11px] text-muted-foreground">{row.rollNumber}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Section */}
                      <TableCell className="text-center">
                        <span className="md-badge md-badge--outline text-xs">{row.sectionName}</span>
                      </TableCell>

                      {/* Subject marks */}
                      {subjectNames.map((name) => {
                        const mark = row.subjects[name];
                        if (!mark) return (
                          <TableCell key={name} className="text-center">
                            <span className="text-xs text-muted-foreground">—</span>
                          </TableCell>
                        );
                        if (mark.isAbsent) return (
                          <TableCell key={name} className="text-center">
                            <span className="text-xs text-muted-foreground italic">Absent</span>
                          </TableCell>
                        );
                        return (
                          <TableCell key={name} className="text-center">
                            <MarkBar obtained={mark.totalMarksObtained} max={mark.totalMaxMarks} />
                          </TableCell>
                        );
                      })}

                      {/* Total */}
                      <TableCell className="text-center">
                        <div className="font-semibold text-sm">{row.totalObtained}</div>
                        <div className="text-[11px] text-muted-foreground">{totalPct}%</div>
                      </TableCell>

                      {/* Rank */}
                      <TableCell className="text-center">{rankChip((row as any).rank)}</TableCell>

                      {/* Overall status */}
                      <TableCell className="text-center">
                        <StatusBadge status={row.overallStatus} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                         {/* Report card print button — always visible */}
                          {examDetail && (
                            <ReportCardButton
                              row={row}
                              examDetail={examDetail}
                              subjectNames={subjectNames}
                              rank={(row as any).rank}
                              totalStudents={
                                rankMode === "CLASS" 
                                  ? ranked.length 
                                  : ranked.filter(r => r.sectionName === row.sectionName).length
                              } // <--- THE FIX
                            />
                          )}

                          {/* Approve / Reject — only for SUBMITTED marks */}
                          {hasSubmitted ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={approving}
                                onClick={() => {
                                  const submitted = allSubjectMarks.filter((m) => m.status === "SUBMITTED");
                                  submitted.forEach((m) => doApprove(m.id));
                                }}
                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Approve all submitted"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const submitted = allSubjectMarks.find((m) => m.status === "SUBMITTED");
                                  if (submitted) setRejectMarkId(submitted.id);
                                }}
                                className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                title="Reject"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            !examDetail && (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded component rows */}
                    {isExpanded && (
                      <TableRow key={`exp-${row.enrollmentId}`} className="bg-muted/30">
                        <TableCell colSpan={4 + subjectNames.length + 4} className="py-3 pl-12">
                          <div className="flex gap-8 flex-wrap">
                            {subjectNames.map((name) => {
                              const mark = row.subjects[name];
                              if (!mark || !mark.components.length) return null;
                              return (
                                <div key={name}>
                                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    {name}
                                  </div>
                                  <div className="flex gap-4 flex-wrap">
                                    {mark.components.map((c) => (
                                      <div key={c.id} className="flex flex-col gap-0.5 min-w-[80px]">
                                        <span className="text-[11px] text-muted-foreground">{c.componentName}</span>
                                        <span className="text-sm font-medium text-foreground">
                                          {c.isAbsent ? "Absent" : `${c.marksObtained ?? "—"} / ${c.maxMarks}`}
                                        </span>
                                        {c.passMarks != null && (
                                          <span className="text-[10px] text-muted-foreground">Pass: {c.passMarks}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <RejectDialog
        markId={rejectMarkId}
        onClose={() => setRejectMarkId(null)}
        onConfirm={(markId, reason) => doReject({ markId, reason })}
        loading={rejecting}
      />
    </div>
  );
}