// src/pages/ExamDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Loader2, FileText, Calendar, BookOpen,
  CheckCircle2, Clock, AlertCircle, Edit3, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getExamDetails, publishExam, unpublishExam, markCompleted, startEvaluation } from "@/lib/api/exams";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";

export default function ExamDetails() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: exam, isLoading } = useQuery({
    queryKey: ["examDetails", examId],
    queryFn: () => getExamDetails(Number(examId)),
    enabled: !!examId
  });

  const { mutate: handlePublish, isPending: isPublishing } = useMutation({
    mutationFn: () => publishExam(Number(examId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examDetails", examId] });
      toast.success("Exam published successfully!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err))
  });

  const { mutate: handleUnpublish, isPending: isUnpublishing } = useMutation({
    mutationFn: () => unpublishExam(Number(examId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examDetails", examId] });
      toast.success("Exam reverted to draft.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err))
  });

  const { mutate: handleStartEvaluation, isPending: isStartingEval } = useMutation({
    mutationFn: () => startEvaluation(Number(examId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examDetails", examId] });
      toast.success("Evaluation phase started. Marks entry is now open.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err))
  });

  const { mutate: handleMarkCompleted, isPending: isMarking } = useMutation({
    mutationFn: () => markCompleted(Number(examId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examDetails", examId] });
      toast.success("Exam marked as completed.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err))
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!exam) {
    return <div className="p-12 text-center">Exam not found.</div>;
  }

  const statusColor: Record<string, string> = {
    DRAFT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    SCHEDULED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    ONGOING: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    EVALUATION: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    COMPLETED: "bg-green-500/10 text-green-600 border-green-500/20"
  };

  const statusIcon: Record<string, React.ReactNode> = {
    DRAFT: <AlertCircle className="h-4 w-4" />,
    SCHEDULED: <Clock className="h-4 w-4" />,
    ONGOING: <FileText className="h-4 w-4" />,
    EVALUATION: <Edit3 className="h-4 w-4" />,
    COMPLETED: <CheckCircle2 className="h-4 w-4" />
  };

  const canEdit = exam.status === "DRAFT";

  return (
    <div className="md-page">
      {/* Header */}
      <div className="md-hero">
        <div className="md-hero-inner">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("/exam-blueprints")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{exam.name}</h2>
              <p className="text-sm text-white/60">
                {exam.academicYearName} • {exam.classLevelName}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${statusColor[exam.status]}`}>
            {statusIcon[exam.status]}
            {exam.status}
          </span>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Academic Year</p>
          <p className="text-sm font-medium mt-1">{exam.academicYearName}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Class Level</p>
          <p className="text-sm font-medium mt-1">{exam.classLevelName}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Start Date</p>
          <p className="text-sm font-medium mt-1">{exam.startDate}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground uppercase font-semibold">End Date</p>
          <p className="text-sm font-medium mt-1">{exam.endDate}</p>
        </div>
      </div>

      {/* Subject Matrix */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Exam Blueprint
          </h3>
          {canEdit && (
            <Button
              onClick={() => navigate(`/exam-blueprints/setup/${exam.id}`)}
              variant="outline"
              size="sm"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Configuration
            </Button>
          )}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Exam Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-center">Max Marks</TableHead>
              <TableHead className="text-center">Pass Marks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exam.subjects?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No subjects configured yet
                </TableCell>
              </TableRow>
            ) : (
              exam.subjects?.map((subject: any) =>
                subject.components?.map((comp: any, idx: number) => (
                  <TableRow key={`${subject.id}-${comp.id}`}>
                    {idx === 0 && (
                      <TableCell rowSpan={subject.components.length} className="font-semibold">
                        {subject.subjectName}
                      </TableCell>
                    )}
                    <TableCell>{comp.componentName}</TableCell>
                    <TableCell>{comp.examDate || "—"}</TableCell>
                    <TableCell>{comp.examTime || "—"}</TableCell>
                    <TableCell className="text-center">{comp.maxMarks}</TableCell>
                    <TableCell className="text-center">{comp.passMarks}</TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Status-based Info Box */}
      {exam.status === "DRAFT" && (
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-amber-600">
            <span className="font-semibold">Draft Mode:</span> This exam is private and only visible to administrators. 
            Once you've configured all subjects and components, publish it to make it visible to teachers and students.
          </p>
        </div>
      )}

      {exam.status === "SCHEDULED" && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-600">
            <span className="font-semibold">Published:</span> This exam is now visible. 
            It will automatically transition to "Ongoing" on {exam.startDate}.
          </p>
        </div>
      )}

      {exam.status === "ONGOING" && (
        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-sm text-purple-600">
            <span className="font-semibold">Active:</span> The exam is currently in progress. 
            Teachers can view real-time participation and timing.
          </p>
        </div>
      )}

      {exam.status === "EVALUATION" && (
        <div className="mt-6 p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
          <p className="text-sm text-teal-600">
            <span className="font-semibold">Evaluation Phase:</span> The exam has concluded. 
            Teachers can now enter and submit marks for administrative approval.
          </p>
        </div>
      )}

      {exam.status === "COMPLETED" && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-600">
            <span className="font-semibold">Archived:</span> This exam is complete and locked. 
            You can view reports and historical data.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-3">
        {exam.status === "DRAFT" && (
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/exam-blueprints")}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handlePublish()}
              disabled={isPublishing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPublishing && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Publish Exam
            </Button>
          </>
        )}

        {exam.status === "SCHEDULED" && (
          <>
            <Button
              variant="outline"
              onClick={() => handleUnpublish()}
              disabled={isUnpublishing}
            >
              {isUnpublishing && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Unpublish
            </Button>
            <Button
              onClick={() => handleMarkCompleted()}
              disabled={isMarking}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMarking && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Mark as Completed
            </Button>
          </>
        )}

        {exam.status === "ONGOING" && (
          <Button
            onClick={() => handleStartEvaluation()}
            disabled={isStartingEval}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isStartingEval && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            Start Evaluation Phase
          </Button>
        )}

        {exam.status === "EVALUATION" && (
          <>
            <Button
              onClick={() => navigate(`/exam-blueprints/marks/${exam.id}`)}
              className="bg-primary hover:bg-primary/90"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Enter / Manage Marks
            </Button>
            <Button
              onClick={() => handleMarkCompleted()}
              disabled={isMarking}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMarking && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Publish Results & Complete
            </Button>
          </>
        )}

        <Button
          variant="outline"
          onClick={() => navigate("/exam-blueprints")}
        >
          Back to List
        </Button>
      </div>
    </div>
  );
}