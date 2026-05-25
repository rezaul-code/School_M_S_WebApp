// src/pages/IndependentResults.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search, ClipboardList, Archive, CheckCircle2,
  Edit3, Clock, ChevronRight, CalendarDays, Sparkles,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { getAllScheduledExams } from "@/lib/api/exams";
import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { cn } from "@/lib/utils";

type FilterStatus = "ALL" | "COMPLETED" | "EVALUATION";

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:      { label: "Draft",      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",   icon: <Edit3 className="h-3 w-3" /> },
  SCHEDULED:  { label: "Scheduled",  color: "bg-blue-500/10 text-blue-600 border-blue-500/20",      icon: <Clock className="h-3 w-3" /> },
  EVALUATION: { label: "Evaluation", color: "bg-teal-500/10 text-teal-600 border-teal-500/20",      icon: <Edit3 className="h-3 w-3" /> },
  COMPLETED:  { label: "Completed",  color: "bg-green-500/10 text-green-600 border-green-500/20",   icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED:  { label: "Cancelled",  color: "bg-red-500/10 text-red-500 border-red-500/20",         icon: <Archive className="h-3 w-3" /> },
};

export default function IndependentResults() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  const { data: activeYear } = useActiveAcademicYear();
  const yearId = activeYear?.id ?? 1;

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["scheduledExams", yearId],
    queryFn: () => getAllScheduledExams(yearId),
  });

  // Only show COMPLETED and EVALUATION exams — these are the ones with marks
  const viewable = exams.filter(
    (e) => e.status === "COMPLETED" || e.status === "EVALUATION"
  );

  const filtered = viewable.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.classLevelName.toLowerCase().includes(search.toLowerCase()) ||
      e.examTypeName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "ALL" || e.status === filter;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    ALL:        viewable.length,
    COMPLETED:  viewable.filter((e) => e.status === "COMPLETED").length,
    EVALUATION: viewable.filter((e) => e.status === "EVALUATION").length,
  };

  const formatDateRange = (s: string, e: string) => {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `${fmt(s)} — ${fmt(e)}`;
  };

  return (
    <div className="md-page">
      {/* Hero */}
      <div className="md-hero md-hero--class-subject">
        <div className="md-hero-glow" />
        <div className="md-hero-inner">
          <div className="md-hero-left">
            <div className="md-hero-icon-wrap bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="md-hero-text">
              <h2 className="md-hero-title">Independent Results</h2>
              <p className="md-hero-sub">
                Per-exam raw marks view for {activeYear?.name ?? "current"} academic year
              </p>
            </div>
          </div>
          <span className="md-hero-badge">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            {counts.ALL} exams with marks
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="md-toolbar mb-5">
        <div className="md-toolbar-left">
          <div className="md-search-wrap">
            <Search className="md-search-icon" />
            <Input
              placeholder="Search by exam name, class or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-[300px]"
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-muted/30 p-1.5 rounded-xl w-fit mb-6 border border-border">
        {(["ALL", "COMPLETED", "EVALUATION"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
              filter === f
                ? "bg-white text-primary shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {f === "ALL" && <ClipboardList className="h-4 w-4" />}
            {f === "COMPLETED" && <CheckCircle2 className="h-4 w-4" />}
            {f === "EVALUATION" && <Edit3 className="h-4 w-4" />}
            {f === "ALL" ? "All exams" : f === "COMPLETED" ? "Completed" : "In evaluation"}
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted">
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Exam cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="md-card border border-border h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="md-card border border-border">
          <div className="md-empty">
            <ClipboardList className="md-empty-icon" />
            <p className="md-empty-title">No exams found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Exams appear here once they reach Evaluation or Completed status.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((exam) => {
            const meta = STATUS_META[exam.status] ?? STATUS_META.COMPLETED;
            return (
              <button
                key={exam.id}
                onClick={() => navigate(`/independent-results/${exam.id}`)}
                className={cn(
                  "md-card border border-border text-left w-full",
                  "hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
                )}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground leading-tight">
                          {exam.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {exam.examTypeName}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Info row */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="md-badge md-badge--outline text-xs">
                      {exam.classLevelName}
                    </span>
                    {exam.classSectionName && (
                      <span className="md-badge md-badge--outline text-xs">
                        {exam.classSectionName}
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-muted-foreground mb-3">
                    <CalendarDays className="inline h-3 w-3 mr-1 opacity-60" />
                    {formatDateRange(exam.startDate, exam.endDate)}
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border",
                        meta.color
                      )}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                    <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View marks →
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}