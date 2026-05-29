// src/pages/IndependentResults.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search, ClipboardList, Archive, CheckCircle2,
  Edit3, Clock, ChevronRight, CalendarDays, Sparkles,
  Layers, BookOpen
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllScheduledExams } from "@/lib/api/exams";
import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { api } from "@/lib/api/client";
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
  const [classFilter, setClassFilter] = useState<string>("ALL");
  
  // State for Academic Year selection
  const [yearFilter, setYearFilter] = useState<string>("");

  const { data: activeYear } = useActiveAcademicYear();

  // Set the default year filter to the Active Year once it loads
  useEffect(() => {
    if (activeYear?.id && !yearFilter) {
      setYearFilter(activeYear.id.toString());
    }
  }, [activeYear, yearFilter]);

  // Fetch all Academic Years for the dropdown
  const { data: academicYears = [] } = useQuery({
    queryKey: ["academicYearsList"],
    queryFn: async () => {
      const res = await api.get("/api/options/academic-years");
      return Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.content || []);
    }
  });

  // Fetch Classes for Dropdown Filter
  const { data: classes = [] } = useQuery({
    queryKey: ["classLevels"],
    queryFn: async () => {
      const res = await api.get("/api/options/class-levels");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    }
  });

  // Fetch exams using the selected year (fallback to active year id while loading)
  const targetYearId = yearFilter ? parseInt(yearFilter) : (activeYear?.id ?? 1);
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ["scheduledExams", targetYearId],
    queryFn: () => getAllScheduledExams(targetYearId),
    enabled: !!targetYearId, // Only run query if we have a valid ID
  });

  // --- STAT CARDS CALCULATIONS ---
  const totalYearExams = exams.length;
  const inEvaluationCount = exams.filter(e => e.status === "EVALUATION").length;
  const completedCount = exams.filter(e => e.status === "COMPLETED").length;

  // Find the display name for the currently selected year (checking .label first!)
  const selectedYearObj = academicYears.find((y: any) => y.id.toString() === yearFilter);
  const displayYearName = selectedYearObj?.label || selectedYearObj?.name || activeYear?.name || "Selected Year";

  // --- LIST FILTERING LOGIC ---
  // Only show COMPLETED and EVALUATION exams in the interactive list
  const viewable = exams.filter(
    (e) => e.status === "COMPLETED" || e.status === "EVALUATION"
  );

  const filtered = viewable.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.classLevelName.toLowerCase().includes(search.toLowerCase()) ||
      e.examTypeName.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = filter === "ALL" || e.status === filter;
    
    const matchesClass = classFilter === "ALL" || e.classLevelId.toString() === classFilter;

    return matchesSearch && matchesTab && matchesClass;
  });

  // Tab counts based on current class filter
  const classFilteredViewable = viewable.filter(e => classFilter === "ALL" || e.classLevelId.toString() === classFilter);
  const counts = {
    ALL:        classFilteredViewable.length,
    COMPLETED:  classFilteredViewable.filter((e) => e.status === "COMPLETED").length,
    EVALUATION: classFilteredViewable.filter((e) => e.status === "EVALUATION").length,
  };

  const formatDateRange = (s: string, e: string) => {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `${fmt(s)} — ${fmt(e)}`;
  };

  return (
    <div className="md-page">

      {/* ACADEMIC YEAR OVERVIEW STATS */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {displayYearName} Academic Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Exams Created</p>
              <p className="text-2xl font-bold text-slate-900">{isLoadingExams ? "-" : totalYearExams}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <Edit3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Currently in Evaluation</p>
              <p className="text-2xl font-bold text-slate-900">{isLoadingExams ? "-" : inEvaluationCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Fully Completed</p>
              <p className="text-2xl font-bold text-slate-900">{isLoadingExams ? "-" : completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="md-toolbar mb-5 flex-wrap gap-4">
        <div className="md-toolbar-left flex-1 flex flex-wrap gap-4">
          
          {/* Search Box */}
          <div className="md-search-wrap flex-1 min-w-[250px] max-w-[400px]">
            <Search className="md-search-icon" />
            <Input
              placeholder="Search by exam name, class or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full"
            />
          </div>

          {/* Academic Year Dropdown Filter */}
          <div className="w-[180px]">
            <Select value={yearFilter} onValueChange={setYearFilter} disabled={academicYears.length === 0}>
              <SelectTrigger className="h-10 bg-white font-medium">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y: any) => (
                  <SelectItem key={y.id} value={y.id.toString()}>
                    {y.label || y.name || `Year ${y.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Level Dropdown Filter */}
          <div className="w-[180px]">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="h-10 bg-white">
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Classes</SelectItem>
                {classes.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.label || c.displayName || c.name || `Class ${c.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-white p-1.5 rounded-xl w-fit mb-6 border border-slate-200 shadow-sm">
        {(["ALL", "COMPLETED", "EVALUATION"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
              filter === f
                ? "bg-slate-100 text-primary shadow-sm border border-slate-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            {f === "ALL" && <ClipboardList className="h-4 w-4" />}
            {f === "COMPLETED" && <CheckCircle2 className="h-4 w-4" />}
            {f === "EVALUATION" && <Edit3 className="h-4 w-4" />}
            {f === "ALL" ? "All viewable exams" : f === "COMPLETED" ? "Completed" : "In evaluation"}
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700">
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Exam cards */}
      {isLoadingExams ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="md-card border border-slate-200 h-40 bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="md-card border border-dashed border-slate-300 bg-slate-50/50">
          <div className="md-empty py-16">
            <ClipboardList className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
            <p className="text-lg font-medium text-slate-700">No exams match your filters</p>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search query, or selecting a different year/class.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((exam) => {
            const meta = STATUS_META[exam.status] ?? STATUS_META.COMPLETED;
            return (
              <button
                key={exam.id}
                onClick={() => navigate(`/independent-results/${exam.id}`)}
                className={cn(
                  "bg-white rounded-xl border border-slate-200 text-left w-full shadow-sm",
                  "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden"
                )}
              >
                {/* Visual accent bar at top */}
                <div className={`absolute top-0 left-0 right-0 h-1 opacity-50 ${meta.color.split(' ')[0]}`} />

                <div className="p-5 pt-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-base text-slate-800 leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                          {exam.name}
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-1">
                          {exam.examTypeName}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Info badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wide uppercase">
                      {exam.classLevelName}
                    </span>
                    {exam.classSectionName && (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wide uppercase">
                        {exam.classSectionName}
                      </span>
                    )}
                  </div>

                  {/* Date range */}
                  <div className="text-sm font-medium text-slate-600 mb-4 flex items-center">
                    <Clock className="inline h-4 w-4 mr-1.5 text-slate-400" />
                    {formatDateRange(exam.startDate, exam.endDate)}
                  </div>

                  {/* Footer / Status */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border",
                        meta.color
                      )}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                    <span className="text-xs text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Results &rarr;
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