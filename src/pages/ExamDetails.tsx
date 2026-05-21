import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  CalendarDays, ArrowLeft, Loader2, FileText, 
  Clock, CheckCircle2, ShieldAlert, Sparkles, Archive
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getExamDetails } from "@/lib/api/exams";

export default function ExamDetails() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const { data: exam, isLoading } = useQuery({
    queryKey: ["examDetails", examId],
    queryFn: () => getExamDetails(Number(examId)),
    enabled: !!examId
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!exam) return <div className="p-12 text-center">Exam details not found.</div>;

  return (
    <div className="md-page">
      {/* ── Header ──────────────────────────────────── */}
      <div className="md-hero">
        <div className="md-hero-inner">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/exam-blueprints")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-white">{exam.name}</h2>
              <p className="text-white/60 text-sm">Created on {new Date(exam.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
                exam.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'
             }`}>
                {exam.status === 'DRAFT' ? <ShieldAlert className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>}
                {exam.status}
             </span>
          </div>
        </div>
      </div>

      {/* ── Metadata Snapshot ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-6">
        {[ { label: "Academic Year", value: exam.academicYearName },
           { label: "Class Level", value: exam.classLevelName },
           { label: "Start Date", value: exam.startDate },
           { label: "End Date", value: exam.endDate } ].map((item, i) => (
           <div key={i} className="bg-card p-4 rounded-xl border border-border">
             <p className="text-xs text-muted-foreground uppercase font-semibold">{item.label}</p>
             <p className="text-sm font-medium mt-1">{item.value}</p>
           </div>
        ))}
      </div>

      {/* ── Subject Matrix ────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Exam Blueprint Structure
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Exam Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-center">Max Marks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exam.subjects.map((sub: any) => sub.components.map((comp: any) => (
              <TableRow key={comp.subjectComponentId}>
                <TableCell className="font-medium">{sub.subjectName}</TableCell>
                <TableCell>{comp.componentName}</TableCell>
                <TableCell>{comp.examDate || "-"}</TableCell>
                <TableCell>{comp.examTime || "-"}</TableCell>
                <TableCell className="text-center">{comp.maxMarks}</TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>

      {/* ── Action Hub ────────────────────────────────── */}
      <div className="mt-8 flex justify-end gap-3">
        {exam.status === 'DRAFT' && (
          <Button onClick={() => navigate(`/exam-blueprints/setup/${exam.id}`)} className="h-10">
            Edit Blueprint
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate("/exam-blueprints")} className="h-10">
          Back to List
        </Button>
      </div>
    </div>
  );
}