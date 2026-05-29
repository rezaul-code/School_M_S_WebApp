import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calculator, Trophy, CheckCircle2, XCircle, 
  Eye, EyeOff, Loader2, Trash2, FileText, Search, BookOpen, Layers
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { api } from "@/lib/api/client";
import { calculateBulk, getClassResults, clearClassResults, publishResult, unpublishResult } from "@/lib/api/results";

// Import the Report Card component
import ReportCardView from "@/components/print/AnnualReportCardView";

import "@/styles/master-data.css";

export default function ConsolidatedAnnual() {
  const queryClient = useQueryClient();
  const { data: activeYear } = useActiveAcademicYear();
  
  // -- States --
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  
  // Secondary Filters
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("ALL");
  const [rankMode, setRankMode] = useState<"CLASS" | "SECTION">("CLASS");
  
  const [viewingReportCardId, setViewingReportCardId] = useState<number | null>(null);

  // Set default active year on load
  useEffect(() => {
    if (activeYear?.id && !selectedYearId) {
      setSelectedYearId(activeYear.id.toString());
    }
  }, [activeYear, selectedYearId]);

  // -- Queries --
  const { data: academicYears = [] } = useQuery({
    queryKey: ["academicYearsList"],
    queryFn: async () => {
      const res = await api.get("/api/options/academic-years");
      return Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.content || []);
    }
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classLevels"],
    queryFn: async () => {
      const res = await api.get("/api/options/class-levels");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    }
  });

  const targetYearId = selectedYearId ? parseInt(selectedYearId) : (activeYear?.id ?? 1);

  const { data: results = [], isLoading: isLoadingResults, refetch } = useQuery({
    queryKey: ["classResults", targetYearId, selectedClassId],
    queryFn: () => getClassResults(targetYearId, parseInt(selectedClassId)),
    enabled: !!targetYearId && !!selectedClassId,
  });

  // Extract unique sections from the fetched results
  const sections = useMemo(() => {
    const s = new Set<string>();
    results.forEach((r: any) => {
      if (r.sectionName) s.add(r.sectionName);
    });
    return Array.from(s).sort();
  }, [results]);

  // -- Data Processing (Filtering & Sorting) --
  const processedResults = useMemo(() => {
    let filtered = results;
    
    // 1. Search Filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((r: any) => 
        r.studentName?.toLowerCase().includes(lowerSearch) || 
        r.studentRegistrationNo?.toLowerCase().includes(lowerSearch) ||
        r.enrollmentNo?.toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Section Filter
    if (sectionFilter !== "ALL") {
      filtered = filtered.filter((r: any) => r.sectionName === sectionFilter);
    }

    // 3. Sort dynamically based on the selected Rank Mode
    return [...filtered].sort((a: any, b: any) => {
      const rankA = rankMode === "CLASS" ? (a.rankInClass || 99999) : (a.rankInSection || 99999);
      const rankB = rankMode === "CLASS" ? (b.rankInClass || 99999) : (b.rankInSection || 99999);
      return rankA - rankB;
    });
  }, [results, search, rankMode, sectionFilter]);

  // -- Mutations --
  const calcMutation = useMutation({
    mutationFn: () => calculateBulk(targetYearId, parseInt(selectedClassId), true),
    onSuccess: (data) => {
      if (data.failedCount > 0) {
        toast.warning(`Calculated ${data.successCount} students, but ${data.failedCount} failed. Check configuration.`);
      } else {
        toast.success(`Successfully calculated results and assigned ranks for ${data.successCount} students.`);
      }
      refetch();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to run calculation engine.")
  });

  const publishMutation = useMutation({
    mutationFn: (enrollmentId: number) => publishResult(enrollmentId),
    onSuccess: () => { toast.success("Report card published."); refetch(); }
  });

  const unpublishMutation = useMutation({
    mutationFn: (enrollmentId: number) => unpublishResult(enrollmentId),
    onSuccess: () => { toast.success("Report card unpublished."); refetch(); }
  });

  const clearResultsMutation = useMutation({
    mutationFn: () => clearClassResults(targetYearId, parseInt(selectedClassId)),
    onSuccess: () => { toast.success("All calculated results cleared."); refetch(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to clear results.")
  });

  return (
    <div className="md-page relative">
      
      {/* Top Control Panel */}
      <div className="md-card p-5 border border-border mb-6 flex flex-col lg:flex-row gap-4 items-end bg-muted/10">
        
        {/* Academic Year Dropdown */}
        <div className="space-y-2 flex-1 min-w-[200px] max-w-xs">
          <Label className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary"/> Academic Year</Label>
          <Select value={selectedYearId} onValueChange={setSelectedYearId} disabled={academicYears.length === 0}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y: any) => (
                <SelectItem key={y.id} value={y.id.toString()}>{y.label || y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Class Level Dropdown */}
        <div className="space-y-2 flex-1 min-w-[200px] max-w-xs">
          <Label className="flex items-center gap-2"><Layers className="h-4 w-4 text-primary"/> Target Class Level</Label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Select class..." /></SelectTrigger>
            <SelectContent>
              {classes.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.label || c.displayName || c.name || `Class ${c.id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Engine Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Button 
            variant="outline"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 bg-white" 
            disabled={!selectedClassId || results.length === 0 || clearResultsMutation.isPending}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete all calculated report cards for this class? Raw marks will NOT be deleted.")) {
                clearResultsMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Clear Results
          </Button>

          <Button 
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white" 
            disabled={!selectedClassId || calcMutation.isPending}
            onClick={() => calcMutation.mutate()}
          >
            {calcMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            Run Calculation Engine
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedClassId ? (
        <div className="md-empty border border-dashed border-border rounded-xl p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Select a Class</h3>
          <p className="text-muted-foreground text-sm">Choose a class level above to view or calculate annual results.</p>
        </div>
      ) : isLoadingResults ? (
        <div className="md-card p-12 text-center flex flex-col items-center justify-center text-muted-foreground border border-border">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          Loading calculation ledger...
        </div>
      ) : results.length === 0 ? (
        <div className="md-empty border border-dashed border-border rounded-xl p-12 text-center">
          <Calculator className="h-12 w-12 mx-auto opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No Results Calculated</h3>
          <p className="text-muted-foreground text-sm mb-4">Run the calculation engine to generate report cards for this class.</p>
          <Button onClick={() => calcMutation.mutate()} disabled={calcMutation.isPending}>
            Run Calculation Now
          </Button>
        </div>
      ) : (
        <div className="md-card border border-border overflow-hidden">
          
          {/* Secondary Toolbar (Filters & Rank Mode) */}
          <div className="p-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative min-w-[250px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student or roll no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-white"
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-white px-2.5 py-1 rounded-md border shadow-sm">
                {processedResults.length} records
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* SECTION FILTER DROPDOWN */}
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="h-9 px-3 text-sm font-medium border border-slate-200 rounded-md bg-white text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <option value="ALL">All Sections</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* RANK MODE TOGGLE */}
              <select
                value={rankMode}
                onChange={(e) => setRankMode(e.target.value as "CLASS" | "SECTION")}
                className="h-9 px-3 text-sm font-bold border border-blue-200 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors outline-none cursor-pointer"
              >
                <option value="CLASS">Rank Across Class</option>
                <option value="SECTION">Rank Within Section</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px] text-center">Rank</TableHead>
                <TableHead>Student Details</TableHead>
                <TableHead className="text-center">Section</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedResults.map((res: any) => {
                // Determine which rank to show based on toggle
                const activeRank = rankMode === "CLASS" ? res.rankInClass : res.rankInSection;
                
                return (
                  <TableRow key={res.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-center">
                      {activeRank ? (
                        <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-full text-xs font-bold border ${
                          activeRank === 1 ? "bg-amber-100 text-amber-800 border-amber-200" :
                          activeRank === 2 ? "bg-slate-200 text-slate-800 border-slate-300" :
                          activeRank === 3 ? "bg-orange-100 text-orange-800 border-orange-200" :
                          "bg-primary/10 text-primary border-primary/20"
                        }`}>
                          #{activeRank}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{res.studentName}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">{res.studentRegistrationNo || res.enrollmentNo}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wide uppercase">
                        {res.sectionName || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono font-bold text-slate-700">{res.percentage}%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-extrabold text-primary text-base">{res.grade || "-"}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {res.resultStatus === "PASS" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="h-3.5 w-3.5" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-md">
                          <XCircle className="h-3.5 w-3.5" /> {res.resultStatus}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-slate-600 hover:text-slate-900 border-slate-200 bg-white" 
                          onClick={() => setViewingReportCardId(res.enrollmentId)}
                        >
                          <FileText className="h-4 w-4 mr-1.5" /> Report Card
                        </Button>

                        {res.published ? (
                          <Button variant="outline" size="sm" className="text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100" onClick={() => unpublishMutation.mutate(res.enrollmentId)}>
                            <EyeOff className="h-4 w-4 mr-1.5" /> Unpublish
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 font-medium" onClick={() => publishMutation.mutate(res.enrollmentId)}>
                            <Eye className="h-4 w-4 mr-1.5" /> Publish
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* REPORT CARD OVERLAY */}
      {viewingReportCardId && (
        <ReportCardView 
          enrollmentId={viewingReportCardId} 
          onClose={() => setViewingReportCardId(null)} 
        />
      )}
    </div>
  );
}