import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  CheckCircle2, ChevronRight, BookOpen, Clock, 
  Save, ArrowLeft, Loader2, FileText, RotateCcw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { 
  createExamSchedule, 
  getDraftScheduleMatrix, 
  getSavedExamSchedule,
  bulkSaveExamSchedule, 
  getAllExamTypes,
  getExamById,
  updateExamHeader
} from "@/lib/api/exams";
import { getClassLevelOptions } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";
import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";

// examStartTime and examEndTime are user-selected
// durationMinutes is derived by the backend — shown read-only in the UI
type ComponentScheduleState = {
  examDate: string;
  examStartTime: string; // renamed from examTime
  examEndTime: string;   // new — user selects this
  maxMarks: number;
  passMarks: number;
};

// Calculates duration in minutes from two HH:mm strings — for display only
function calcDuration(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : null; // return null if end <= start, so user sees — as a hint
}

export default function ExamSetupWizard() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: activeYear } = useActiveAcademicYear();

  const [currentStep, setCurrentStep] = useState(examId ? 2 : 1);
  const [isResumeMode, setIsResumeMode] = useState(false);

  // --- Step 1 State ---
  const [name, setName] = useState("");
  const [examTypeId, setExamTypeId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- Step 2 & 3 State ---
  const [selectedComponents, setSelectedComponents] = useState<Set<number>>(new Set());
  const [scheduleData, setScheduleData] = useState<Record<number, ComponentScheduleState>>({});

  // --- Queries ---
  const { data: examTypes = [] } = useQuery({ queryKey: ["examTypes"], queryFn: getAllExamTypes });
  const { data: classes = [] } = useQuery({ queryKey: ["classLevels"], queryFn: getClassLevelOptions });
  
  const { data: existingExam } = useQuery({
    queryKey: ["examHeader", examId],
    queryFn: () => getExamById(Number(examId)),
    enabled: !!examId && currentStep === 1,
  });

  const { data: matrix, isLoading: isLoadingMatrix } = useQuery({
    queryKey: ["examDraftMatrix", examId],
    queryFn: () => getDraftScheduleMatrix(Number(examId)),
    enabled: !!examId && currentStep >= 2,
  });

  const { data: savedSchedule, isLoading: isLoadingSavedSchedule } = useQuery({
    queryKey: ["savedExamSchedule", examId],
    queryFn: () => getSavedExamSchedule(Number(examId)),
    enabled: !!examId && currentStep >= 2,
    staleTime: 0,
  });

  // --- Effects ---
  useEffect(() => {
    if (existingExam && currentStep === 1) {
      setName(existingExam.name);
      setExamTypeId(existingExam.examTypeId.toString());
      setClassLevelId(existingExam.classLevelId.toString());
      setStartDate(existingExam.startDate);
      setEndDate(existingExam.endDate);
    }
  }, [existingExam, currentStep]);

  useEffect(() => {
    // Only hydrate when both matrix and saved data are available
    if (savedSchedule && matrix) {
      setIsResumeMode(true);
      const newSelected = new Set<number>();
      const newScheduleData: Record<number, ComponentScheduleState> = {};

      savedSchedule.subjects.forEach(subject => {
        subject.components.forEach(comp => {
          if (comp.maxMarks && comp.maxMarks > 0) {
            newSelected.add(comp.subjectComponentId);
            newScheduleData[comp.subjectComponentId] = {
              examDate:      comp.examDate      || "",
              examStartTime: comp.examStartTime ? comp.examStartTime.substring(0, 5) : "09:00",
              examEndTime:   comp.examEndTime   ? comp.examEndTime.substring(0, 5)   : "10:00",
              maxMarks:      comp.maxMarks,
              passMarks:     comp.passMarks || 0,
            };
          }
        });
      });

      setSelectedComponents(newSelected);
      setScheduleData(newScheduleData);
    }
  }, [savedSchedule, matrix]);

  // --- Step 1 Mutations ---
  const { mutate: handleCreateDraft, isPending: isCreatingDraft } = useMutation({
    mutationFn: () => {
      if (!name) throw new Error("Exam Description Name is required.");
      if (!examTypeId) throw new Error("Exam Type Blueprint is required.");
      if (!classLevelId) throw new Error("Target Class Level is required.");
      if (!startDate || !endDate) throw new Error("Start and End dates are required.");

      return createExamSchedule({
        name,
        academicYearId: activeYear?.id || 1, 
        examTypeId: Number(examTypeId),
        classLevelId: Number(classLevelId),
        classSectionId: null, 
        startDate,
        endDate
      });
    },
    onSuccess: (newExam) => { 
      queryClient.invalidateQueries({ queryKey: ["scheduledExams"] });
      toast.success("Exam framework created.");
      navigate(`/exam-blueprints/setup/${newExam.id}`);
      setCurrentStep(2);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, err instanceof Error ? err.message : "Failed to initialize exam."));
    },
  });

  const { mutate: handleUpdateExamHeader, isPending: isUpdatingHeader } = useMutation({
    mutationFn: () => {
      if (!name) throw new Error("Exam Description Name is required.");
      if (!startDate || !endDate) throw new Error("Start and End dates are required.");

      return updateExamHeader(Number(examId), { name, startDate, endDate });
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["scheduledExams"] });
      toast.success("Exam details updated.");
      setCurrentStep(2);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, err instanceof Error ? err.message : "Failed to update exam."));
    },
  });

  // --- Step 2/3 Handlers ---
  const handleToggleComponent = (compId: number, defaultMaxMarks: number = 100, defaultPassMarks: number = 33) => {
    setSelectedComponents(prev => {
      const next = new Set(prev);
      if (next.has(compId)) {
        next.delete(compId);
        setScheduleData(curr => {
          const updated = { ...curr };
          delete updated[compId];
          return updated;
        });
      } else {
        next.add(compId);
        setScheduleData(curr => ({
          ...curr,
          [compId]: curr[compId] || {
            examDate:      startDate || "",
            examStartTime: "09:00",
            examEndTime:   "11:00",
            maxMarks:      defaultMaxMarks,
            passMarks:     defaultPassMarks,
          }
        }));
      }
      return next;
    });
  };

  const handleGridChange = (compId: number, field: keyof ComponentScheduleState, value: string | number) => {
    setScheduleData(prev => ({ ...prev, [compId]: { ...prev[compId], [field]: value } }));
  };

  const { mutate: handleBulkSave, isPending: isSavingSchedule } = useMutation({
    mutationFn: () => {
      if (!matrix) throw new Error("No data loaded");

      const payloadSubjects = matrix.subjects.map(subject => {
        const activeComponents = subject.components.filter(c => selectedComponents.has(c.subjectComponentId));
        if (activeComponents.length === 0) return null;

        return {
          classSubjectId: subject.classSubjectId,
          passMarks: 0,
          components: activeComponents.map(c => {
            const data = scheduleData[c.subjectComponentId];
            // Ensure HH:mm:ss format for backend LocalTime parsing
            const toTimeString = (t: string) =>
              t ? (t.length === 5 ? t + ":00" : t) : "";
            return {
              subjectComponentId: c.subjectComponentId,
              maxMarks:      data.maxMarks,
              passMarks:     data.passMarks,
              examDate:      data.examDate,
              examStartTime: toTimeString(data.examStartTime),
              examEndTime:   toTimeString(data.examEndTime),
              // durationMinutes NOT sent — backend calculates it
            };
          })
        };
      }).filter(Boolean);

      return bulkSaveExamSchedule(Number(examId), { subjects: payloadSubjects as any });
    },
    onSuccess: () => {
      toast.success("Exam schedule successfully published.");
      queryClient.invalidateQueries({ queryKey: ["scheduledExams"] });
      navigate("/exam-blueprints");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to save schedule.")),
  });

  const StepIcon = ({ step, current, label }: { step: number, current: number, label: string }) => {
    const isCompleted = current > step;
    const isActive = current === step;
    return (
      <div className={`flex items-center gap-2 text-sm font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'}`}>
        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : 
         <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${isActive ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-muted border border-border text-muted-foreground'}`}>{step}</div>}
        {label}
      </div>
    );
  };

  return (
    <div className="md-page">
      

      <div className="md-wizard">
        <div className="flex items-center justify-between mb-12 px-6">
          <StepIcon step={1} current={currentStep} label="Details & Framework" />
          <div className={`flex-1 h-1 mx-4 rounded ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />
          <StepIcon step={2} current={currentStep} label="Subject Selection" />
          <div className={`flex-1 h-1 mx-4 rounded ${currentStep > 2 ? 'bg-primary' : 'bg-muted'}`} />
          <StepIcon step={3} current={currentStep} label="Timetable Layout" />
        </div>

        {/* ── Step 1 ── */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
            <div className="flex items-center gap-2 text-primary font-medium">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg">Assessment Blueprint Configuration</h3>
            </div>
            <div className="space-y-6 bg-card p-8 rounded-xl border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="space-y-2">
                  <Label htmlFor="exam-name" className="text-sm font-medium">Exam Description Name</Label>
                  <Input id="exam-name" placeholder="e.g., Mid-Term Exams, Annual Final..." value={name} onChange={(e) => setName(e.target.value)} className="h-10 text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-type" className="text-sm font-medium">Exam Type Blueprint</Label>
                  <Select value={examTypeId} onValueChange={setExamTypeId} disabled={isResumeMode}>
                    <SelectTrigger id="exam-type" className="h-10 text-base">
                      <SelectValue placeholder="Select blueprint..." />
                    </SelectTrigger>
                    <SelectContent>{examTypes.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name} ({e.code})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-level" className="text-sm font-medium">Target Class Level</Label>
                <Select value={classLevelId} onValueChange={setClassLevelId} disabled={isResumeMode}>
                  <SelectTrigger id="class-level" className="h-10 text-base">
                    <SelectValue placeholder="Select class..." />
                  </SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm font-medium">Global Start Date</Label>
                  <Input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-sm font-medium">Global End Date</Label>
                  <Input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 text-base" />
                </div>
              </div>
            </div>
            <div className="flex justify-start pt-4 gap-3">
              <Button variant="outline" onClick={() => navigate("/exam-blueprints")} className="h-10 px-6">Cancel</Button>
              <Button onClick={() => isResumeMode ? handleUpdateExamHeader() : handleCreateDraft()} disabled={isCreatingDraft || isUpdatingHeader} className="h-10 px-8 text-base">
                {isCreatingDraft || isUpdatingHeader ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {isResumeMode ? "Update & Continue" : "Initialize & Continue"} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-medium">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-lg">Select Target Components</h3>
              </div>
              {isResumeMode && <span className="text-xs bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full border border-blue-500/20">Resuming saved configuration</span>}
            </div>
            {isLoadingMatrix || isLoadingSavedSchedule ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                  {matrix?.subjects.map(subject => {
                    const isActive = subject.components.some(c => selectedComponents.has(c.subjectComponentId));
                    return (
                      <div key={subject.classSubjectId} className={`p-5 rounded-xl border transition-all duration-200 ${isActive ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-sm' : 'bg-card border-border hover:border-border/80'}`}>
                        <div className="font-semibold text-base mb-4 text-foreground flex items-start justify-between gap-2">
                          <span className="leading-tight">{subject.subjectName}</span>
                          <span className="text-[10px] uppercase font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border flex-shrink-0">{subject.subjectCode}</span>
                        </div>
                        <div className="space-y-3">
                          {subject.components.map(comp => (
                            <div key={comp.subjectComponentId} className="flex items-center space-x-3 bg-background p-2.5 rounded-lg border border-border">
                              <Checkbox id={`comp-${comp.subjectComponentId}`} checked={selectedComponents.has(comp.subjectComponentId)} onCheckedChange={() => handleToggleComponent(comp.subjectComponentId)} className="h-4 w-4" />
                              <label htmlFor={`comp-${comp.subjectComponentId}`} className="text-sm font-medium cursor-pointer flex-1 text-foreground">{comp.componentName}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between pt-8 border-t border-border mt-8">
                  <Button variant="outline" onClick={() => navigate("/exam-blueprints")} className="h-10 px-6">Cancel Setup</Button>
                  <Button onClick={() => setCurrentStep(3)} disabled={selectedComponents.size === 0} className="h-10 px-8">Configure Timetable <ChevronRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 3 ── */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Clock className="h-5 w-5" />
                <h3 className="text-lg">Timetable & Marks Configuration</h3>
              </div>
            </div>
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm w-full">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="py-4">Subject Component</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    {/* Duration — read-only, derived from start/end */}
                    <TableHead className="w-28 text-center">Duration (min)</TableHead>
                    <TableHead className="w-28 text-center">Max Marks</TableHead>
                    <TableHead className="w-28 text-center">Pass Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix?.subjects.map(subject =>
                    subject.components
                      .filter(c => selectedComponents.has(c.subjectComponentId))
                      .map(comp => {
                        const data = scheduleData[comp.subjectComponentId];
                        const duration = data
                          ? calcDuration(data.examStartTime, data.examEndTime)
                          : null;

                        return (
                          <TableRow key={comp.subjectComponentId} className="hover:bg-transparent">
                            <TableCell className="py-3">
                              <div className="font-medium text-sm text-foreground">{subject.subjectName}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{comp.componentName}</div>
                            </TableCell>

                            {/* Exam Date */}
                            <TableCell>
                              <Input
                                type="date"
                                className="h-9 text-sm w-[140px]"
                                value={data?.examDate || ""}
                                onChange={e => handleGridChange(comp.subjectComponentId, 'examDate', e.target.value)}
                              />
                            </TableCell>

                            {/* Start Time — user editable */}
                            <TableCell>
                              <Input
                                type="time"
                                className="h-9 text-sm w-[120px]"
                                value={data?.examStartTime || ""}
                                onChange={e => handleGridChange(comp.subjectComponentId, 'examStartTime', e.target.value)}
                              />
                            </TableCell>

                            {/* End Time — user editable */}
                            <TableCell>
                              <Input
                                type="time"
                                className="h-9 text-sm w-[120px]"
                                value={data?.examEndTime || ""}
                                onChange={e => handleGridChange(comp.subjectComponentId, 'examEndTime', e.target.value)}
                              />
                            </TableCell>

                            {/* Duration — read-only, calculated from start/end */}
                            {/* Duration — read-only, calculated from start/end */}
                            <TableCell className="text-center">
                              {data?.examStartTime && data?.examEndTime && !duration ? (
                                // End time is before or equal to start time
                                <div className="h-9 flex items-center justify-center text-xs rounded-md px-2 bg-red-500/10 text-red-500 border border-red-500/20">
                                  End &lt; Start
                                </div>
                              ) : (
                                <div className={`h-9 flex items-center justify-center text-sm rounded-md px-3 border ${
                                  duration !== null
                                    ? "bg-muted text-foreground border-border"
                                    : "bg-muted/40 text-muted-foreground border-dashed border-border"
                                }`}>
                                  {duration !== null ? `${duration} min` : "—"}
                                </div>
                              )}
                            </TableCell>

                            {/* Max Marks */}
                            <TableCell>
                              <Input
                                type="number"
                                className="h-9 text-sm text-center"
                                value={data?.maxMarks || ""}
                                onChange={e => handleGridChange(comp.subjectComponentId, 'maxMarks', Number(e.target.value))}
                              />
                            </TableCell>

                            {/* Pass Marks */}
                            <TableCell>
                              <Input
                                type="number"
                                className="h-9 text-sm text-center"
                                value={data?.passMarks || ""}
                                onChange={e => handleGridChange(comp.subjectComponentId, 'passMarks', Number(e.target.value))}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between pt-8 border-t border-border mt-8">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="h-10 px-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => handleBulkSave()} disabled={isSavingSchedule} className="h-10 px-8">
                {isSavingSchedule ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Publish
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}