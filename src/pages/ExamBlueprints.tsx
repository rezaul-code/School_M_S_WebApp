import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Plus, CalendarDays, Search, Sparkles, 
  ShieldAlert, CheckCircle2, ArrowRight, 
  Clock, PlayCircle, Archive, FileEdit,
  Send, Eye, ArrowLeft, Activity, CheckCircle, FileText, Edit3
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/common/Pagination";
import { 
  getAllScheduledExams, 
  publishExam, 
  unpublishExam, 
  markCompleted,
  startEvaluation 
} from "@/lib/api/exams";
import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";

const ITEMS_PER_PAGE = 10;

type TabType = "DRAFT" | "SCHEDULED" | "ONGOING" | "EVALUATION" | "COMPLETED";

export default function ExamBlueprints() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("DRAFT");

  const { data: activeYear } = useActiveAcademicYear();
  const currentYearId = activeYear?.id || 1;

  const { data: scheduledExams = [], isLoading } = useQuery({
    queryKey: ["scheduledExams", currentYearId], 
    queryFn: () => getAllScheduledExams(currentYearId),
  });

  // ─── MUTATIONS FOR IN-LINE ACTIONS ─────────────────────────────
  const { mutate: handlePublish } = useMutation({
    mutationFn: (id: number) => publishExam(id),
    onSuccess: () => {
      toast.success("Exam published successfully.");
      queryClient.invalidateQueries({ queryKey: ["scheduledExams"] });
    }
  });

  const { mutate: handleUnpublish } = useMutation({
    mutationFn: (id: number) => unpublishExam(id),
    onSuccess: () => {
      toast.success("Exam reverted to draft.");
      queryClient.invalidateQueries({ queryKey: ["scheduledExams"] });
    }
  });

  const { mutate: handleStartEvaluation } = useMutation({
    mutationFn: (id: number) => startEvaluation(id),
    onSuccess: () => {
      toast.success("Evaluation phase started. Marks entry open.");
      queryClient.invalidateQueries({ queryKey: ["scheduledExams"] });
    }
  });

  const { mutate: handleMarkCompleted } = useMutation({
    mutationFn: (id: number) => markCompleted(id),
    onSuccess: () => {
      toast.success("Exam marked as completed.");
      queryClient.invalidateQueries({ queryKey: ["scheduledExams"] });
    }
  });

  // Calculate counts for tabs
  const counts = {
    DRAFT: scheduledExams.filter(e => e.status === "DRAFT").length,
    SCHEDULED: scheduledExams.filter(e => e.status === "SCHEDULED").length,
    ONGOING: scheduledExams.filter(e => e.status === "ONGOING").length,
    EVALUATION: scheduledExams.filter(e => e.status === "EVALUATION").length,
    COMPLETED: scheduledExams.filter(e => e.status === "COMPLETED").length,
  };

  // Filter logic
  const filtered = scheduledExams.filter(
    (e) =>
      e.status === activeTab &&
      (e.name?.toLowerCase().includes(search.toLowerCase()) ||
       e.examTypeName?.toLowerCase().includes(search.toLowerCase()) ||
       e.classLevelName?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const TabButton = ({ value, label, icon, count }: { value: TabType, label: string, icon: React.ReactNode, count: number }) => (
    <button
      onClick={() => { setActiveTab(value); setPage(0); }}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
        activeTab === value ? "bg-white text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon} {label} 
      <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-muted">{count}</span>
    </button>
  );

  return (
    <div className="md-page">
      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="md-hero md-hero--class-subject">
        <div className="md-hero-glow" />
        <div className="md-hero-inner">
          <div className="md-hero-left">
            <div className="md-hero-icon-wrap bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="md-hero-text">
              <h2 className="md-hero-title">Exam Schedules Blueprint</h2>
              <p className="md-hero-sub">
                Manage and launch scheduled testing sessions for the {activeYear?.name || "current"} academic session
              </p>
            </div>
          </div>
          <span className="md-hero-badge">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            Active Schedules
          </span>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="md-toolbar mb-6">
        <div className="md-toolbar-left">
          <div className="md-search-wrap">
            <Search className="md-search-icon" />
            <Input
              placeholder="Search by exam layout parameters..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="h-9 w-[300px]"
            />
          </div>
        </div>
        <div className="md-toolbar-right">
          <Button onClick={() => navigate("/exam-blueprints/setup")} className="gap-2 h-9 text-sm">
            <Plus className="h-4 w-4" />
            Schedule New Exam
          </Button>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────── */}
      <div className="flex space-x-1 bg-muted/30 p-1.5 rounded-xl w-fit mb-6 border border-border">
        <TabButton value="DRAFT" icon={<FileEdit className="h-4 w-4"/>} label="Drafts" count={counts.DRAFT} />
        <TabButton value="SCHEDULED" icon={<Clock className="h-4 w-4"/>} label="Upcoming" count={counts.SCHEDULED} />
        <TabButton value="ONGOING" icon={<PlayCircle className="h-4 w-4"/>} label="Active" count={counts.ONGOING} />
        <TabButton value="EVALUATION" icon={<Edit3 className="h-4 w-4"/>} label="Evaluation" count={counts.EVALUATION} />
        <TabButton value="COMPLETED" icon={<Archive className="h-4 w-4"/>} label="History" count={counts.COMPLETED} />
      </div>

      {/* ── Grid/Table Representation Card ─────────────────── */}
      <div className="md-card border border-border shadow-sm">
        <div className="md-table-wrap">
          <Table className="md-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead className="w-[260px]">Target Session Stream Track</TableHead>
                <TableHead>Class Tier</TableHead>
                <TableHead>Testing Windows</TableHead>
                <TableHead>Process Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {[40, 240, 90, 140, 180, 100].map((w, j) => (
                      <TableCell key={j}><div className="md-skel" style={{ height: "14px", width: `${w}px` }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="md-empty">
                      <CalendarDays className="md-empty-icon" />
                      <p className="md-empty-title">No scheduled assessment tracking streams located</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((exam, idx) => (
                  <TableRow key={exam.id}>
                    <TableCell className="md-cell-index">{startIdx + idx + 1}</TableCell>
                    
                    {/* ---> FIX APPLIED HERE <--- */}
                    <TableCell>
                      <div className="font-medium text-sm text-sidebar-foreground">
                        {exam.name || exam.examTypeName || "Unnamed Exam Session"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {exam.examTypeCode || "Unknown Type"}
                      </div>
                    </TableCell>

                    <TableCell><span className="md-badge md-badge--outline">{exam.classLevelName}</span></TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {formatDate(exam.startDate)} — {formatDate(exam.endDate)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        exam.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                        exam.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                        exam.status === 'ONGOING' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 
                        exam.status === 'EVALUATION' ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20' : 
                        'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}>
                        {exam.status === 'DRAFT' && <ShieldAlert className="h-3 w-3" />}
                        {exam.status === 'SCHEDULED' && <Clock className="h-3 w-3" />}
                        {exam.status === 'ONGOING' && <PlayCircle className="h-3 w-3" />}
                        {exam.status === 'EVALUATION' && <Edit3 className="h-3 w-3" />}
                        {exam.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                        {exam.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {exam.status === 'DRAFT' && (
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/exam-blueprints/setup/${exam.id}`)}
                          >
                            Resume Setup <ArrowRight className="ml-1.5 h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(exam.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            Publish <Send className="ml-1.5 h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {exam.status === 'SCHEDULED' && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/exam-blueprints/details/${exam.id}`)}
                          >
                            View Details <Eye className="ml-1.5 h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnpublish(exam.id)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            Unpublish <ArrowLeft className="ml-1.5 h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {exam.status === 'ONGOING' && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/exam-blueprints/details/${exam.id}`)}
                          >
                            Monitor <Activity className="ml-1.5 h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStartEvaluation(exam.id)}
                            className="bg-purple-600 text-white hover:bg-purple-700"
                          >
                            Start Evaluation <Edit3 className="ml-1.5 h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {exam.status === 'EVALUATION' && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/exam-blueprints/marks/${exam.id}`)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          >
                            Enter Marks <FileEdit className="ml-1.5 h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkCompleted(exam.id)}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            Publish Results <CheckCircle className="ml-1.5 h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {exam.status === 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/exam-blueprints/details/${exam.id}`)}
                        >
                          View Report <FileText className="ml-1.5 h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        )}
      </div>
    </div>
  );
}