import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { getExamDetails, getExamById } from "@/lib/api/exams";
import { listStudents } from "@/lib/api/students";
import { bulkSaveMarks, bulkSubmitMarks, EnterMarkRequest } from "@/lib/api/marks";
import { api } from "@/lib/api/client";

const MOCK_TEACHER_ID = "930e93b4-c1bb-4a69-9ba5-aa5f4bcaa4a2"; 

export default function ExamMarksEntry() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [gridState, setGridState] = useState<Record<string, EnterMarkRequest>>({});

  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: ["examDetails", examId],
    queryFn: () => getExamDetails(Number(examId)),
    enabled: !!examId
  });

  const { data: baseExam } = useQuery({
    queryKey: ["examHeader", examId],
    queryFn: () => getExamById(Number(examId)),
    enabled: !!examId
  });

  const { data: rosterRes, isLoading: isLoadingRoster } = useQuery({
    queryKey: ["students", baseExam?.academicYearId, baseExam?.classLevelId],
    queryFn: () => listStudents({ 
      academicYearId: baseExam?.academicYearId?.toString(), 
      classLevelId: baseExam?.classLevelId?.toString(), 
      size: 200 
    } as any),
    enabled: !!baseExam?.academicYearId
  });
  const students = rosterRes?.content || [];

  const { data: existingMarks = [], isLoading: isLoadingMarks } = useQuery({
    queryKey: ["examMarks", examId],
    queryFn: () => api.get(`/api/v1/marks/exam/${examId}/with-components`).then(res => res.data.data),
    enabled: !!examId
  });

  const currentSubject = useMemo(() => {
    // FIX: Using examSubjectId instead of classSubjectId
    return exam?.subjects?.find((s: any) => s.examSubjectId?.toString() === selectedSubjectId);
  }, [exam, selectedSubjectId]);

  useEffect(() => {
    if (!currentSubject || students.length === 0) return;

    const newState: Record<string, EnterMarkRequest> = {};
    const subjectMarks = Array.isArray(existingMarks) 
      // FIX: Filtering marks by examSubjectId
      ? existingMarks.filter(m => m.examSubjectId === currentSubject.examSubjectId) 
      : [];

    students.forEach((student: any) => {
      const rowKey = student.enrollmentId || student.id; 
      const existing = subjectMarks.find(m => m.enrollmentId === student.enrollmentId || m.studentId === student.id);
      
      newState[rowKey] = {
        enrollmentId: student.enrollmentId || student.id, 
        examSubjectId: currentSubject.examSubjectId, // FIX: Using examSubjectId here
        isAbsent: existing?.isAbsent || false,
        isExempted: false,
        remarks: existing?.remarks || "",
        enteredByUserId: "00000000-0000-0000-0000-000000000000", // Fix for the 400 Validation error
        
        components: currentSubject.components.map((comp: any) => {
          // Fix: Using examSubjectComponentId for strict backend matching
          const existingComp = existing?.components?.find((c: any) => c.examSubjectComponentId === comp.examSubjectComponentId);
          
          return {
            examSubjectComponentId: comp.examSubjectComponentId, 
            marksObtained: (existingComp?.isAbsent || existing?.isAbsent) ? null : (existingComp?.marksObtained ?? null),
            isAbsent: existingComp?.isAbsent || false,
            remarks: existingComp?.remarks || ""
          };
        })
      };
    });

    setGridState(newState);
  }, [currentSubject, students, existingMarks]);

  const { mutate: handleSaveDraft, isPending: isSaving } = useMutation({
    mutationFn: () => bulkSaveMarks(Object.values(gridState)),
    onSuccess: () => {
      toast.success("Draft marks saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["examMarks", examId] });
    }
  });

  const { mutate: handleSubmit, isPending: isSubmitting } = useMutation({
    // FIX: Using examSubjectId for submission
    mutationFn: () => bulkSubmitMarks(currentSubject?.examSubjectId, MOCK_TEACHER_ID),
    onSuccess: () => {
      toast.success("Marks submitted for admin approval.");
      queryClient.invalidateQueries({ queryKey: ["examMarks", examId] });
    }
  });

  const handleMarkChange = (rowKey: string, compId: number, value: string, maxMarks: number) => {
    const numValue = value === "" ? null : Number(value);
    if (numValue !== null && (numValue < 0 || numValue > maxMarks)) {
        toast.error(`Marks must be between 0 and ${maxMarks}`);
        return;
    }
    setGridState(prev => {
      const row = { ...prev[rowKey] };
      row.components = row.components.map((c: any) => ({ ...c })); 
      
      const compIdx = row.components.findIndex((c: any) => c.examSubjectComponentId === compId);
      if (compIdx !== -1) row.components[compIdx].marksObtained = numValue;
      
      return { ...prev, [rowKey]: row };
    });
  };

  const handleAbsentToggle = (rowKey: string, compId: number, isAbsent: boolean) => {
    setGridState(prev => {
      const row = { ...prev[rowKey] };
      row.components = row.components.map((c: any) => ({ ...c }));
      
      const compIdx = row.components.findIndex((c: any) => c.examSubjectComponentId === compId);
      if (compIdx !== -1) {
          row.components[compIdx].isAbsent = isAbsent;
          if (isAbsent) row.components[compIdx].marksObtained = null;
      }
      return { ...prev, [rowKey]: row };
    });
  };

  const isLoading = isLoadingExam || isLoadingRoster || isLoadingMarks;

  return (
    <div className="md-page">
      <div className="md-hero">
        <div className="md-hero-inner">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/exam-blueprints/details/${examId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Marks Entry: {exam?.name}</h2>
              <p className="text-sm text-white/60">Class: {exam?.classLevelName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="md-card border border-border mt-6">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="w-[300px]">
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject to grade..." />
              </SelectTrigger>
              <SelectContent>
                {exam?.subjects?.map((s: any) => (
                  // FIX: Mapping values using examSubjectId instead of classSubjectId
                  <SelectItem key={s.examSubjectId} value={s.examSubjectId.toString()}>{s.subjectName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {currentSubject && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSaveDraft()} disabled={isSaving || isSubmitting}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Draft
              </Button>
              <Button onClick={() => handleSubmit()} disabled={isSaving || isSubmitting} className="bg-primary">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit for Approval
              </Button>
            </div>
          )}
        </div>

        <div className="md-table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Roll No</TableHead>
                <TableHead className="w-[250px]">Student Name</TableHead>
                {currentSubject?.components?.map((comp: any) => (
                  <TableHead key={comp.examSubjectComponentId} className="text-center">
                    {comp.componentName} <br/>
                    <span className="text-xs text-muted-foreground">(Max: {comp.maxMarks})</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
              ) : !currentSubject ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Please select a subject from the dropdown above to begin.</TableCell></TableRow>
              ) : (
                students.map((student: any) => {
                  const rowKey = student.enrollmentId || student.id;
                  const rowState = gridState[rowKey];
                  if (!rowState) return null;

                  return (
                    <TableRow key={rowKey}>
                      <TableCell className="font-medium">{student.rollNumber}</TableCell>
                      <TableCell>{student.fullName || "Unknown"}</TableCell>
                      
                      {currentSubject.components.map((comp: any) => {
                        const compState = rowState.components.find((c: any) => c.examSubjectComponentId === comp.examSubjectComponentId);
                        const isAbsent = compState?.isAbsent || false;

                        return (
                          <TableCell key={comp.examSubjectComponentId} className="text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="flex items-center space-x-1.5">
                                <Checkbox 
                                  checked={isAbsent}
                                  onCheckedChange={(checked) => handleAbsentToggle(rowKey, comp.examSubjectComponentId, checked as boolean)}
                                />
                                <span className="text-xs text-muted-foreground">AB</span>
                              </div>
                              <Input 
                                type="number"
                                disabled={isAbsent}
                                value={compState?.marksObtained ?? ""}
                                onChange={(e) => handleMarkChange(rowKey, comp.examSubjectComponentId, e.target.value, comp.maxMarks)}
                                className={`w-20 text-center ${isAbsent ? 'bg-muted' : ''}`}
                                placeholder={isAbsent ? "-" : "0"}
                              />
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}