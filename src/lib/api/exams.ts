// src/lib/api/exams.ts
import { api } from "./client";

export interface ExamType {
  id: number;
  name: string;
  code: string;
  category: "WRITTEN" | "PRACTICAL" | "ORAL" | "VIVA";
  description: string;
}

export interface CreateExamTypeRequest {
  name: string;
  code: string;
  category: string;
  description: string;
}

export interface ScheduledExam {
  id: number;
  name: string;
  academicYearId: number;
  academicYearName: string;
  examTypeId: number;
  examTypeCode: string;
  examTypeName: string;
  classLevelId: number;
  classLevelName: string;
  classSectionId: number | null;
  classSectionName: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "SCHEDULED" | "ONGOING" | "EVALUATION" | "COMPLETED" | "CANCELLED";
  classLevelExam: boolean;
  subjects?: any[]; // <--- ADDED: Holds the stitched subjects data
}

export interface CreateExamBatchResponse {
  batchGroupId: string;
  examIds: number[];
}

export interface CreateExamScheduleRequest {
  name: string;
  academicYearId: number;
  examTypeId: number;
  classLevelId: number;
  classSectionIds: number[]; 
  startDate: string;
  endDate: string;
}

export async function getAllExamTypes(): Promise<ExamType[]> {
  const response = await api.get<{ data: ExamType[] }>("/api/v1/exam-types");
  return response.data.data;
}

export async function createExamType(request: CreateExamTypeRequest): Promise<ExamType> {
  const response = await api.post<{ data: ExamType }>("/api/v1/exam-types", request);
  return response.data.data;
}

export async function getAllScheduledExams(academicYearId: number): Promise<ScheduledExam[]> {
  if (!academicYearId || isNaN(academicYearId) || academicYearId <= 0) {
    console.warn("[API] getAllScheduledExams blocked due to invalid academicYearId:", academicYearId);
    return [];
  }
  const response = await api.get<{ data: ScheduledExam[] }>("/api/v1/exams", {
    params: { academicYearId }
  });
  return response.data.data;
}

export async function getExamById(examId: number): Promise<ScheduledExam> {
  const response = await api.get<{ data: ScheduledExam }>(`/api/v1/exams/${examId}`);
  return response.data.data;
}

// <--- FIXED: Frontend Stitch Logic applied here
export async function getApplicableExams(
  academicYearId: number,
  classLevelId: number,
  classSectionId: number
): Promise<ScheduledExam[]> {
  // 1. Fetch the high-level exam details
  const response = await api.get<{ data: ScheduledExam[] }>(
    `/api/v1/exams/applicable?academicYearId=${academicYearId}&classLevelId=${classLevelId}&classSectionId=${classSectionId}`
  );
  
  const exams = response.data.data;

  // 2. Fetch and stitch the subjects/components into each exam
  const examsWithSubjects = await Promise.all(
    exams.map(async (exam) => {
      try {
        const subjectRes = await api.get<{ data: any[] }>(`/api/v1/exams/${exam.id}/subjects`);
        // Attach the subjects array directly to the exam object
        return { ...exam, subjects: subjectRes.data.data };
      } catch (error) {
        // If it fails to fetch subjects for an exam, return it safely without them
        return { ...exam, subjects: [] };
      }
    })
  );

  return examsWithSubjects;
}

export async function updateExamStatus(examId: number, status: "DRAFT" | "ACTIVE" | "COMPLETED"): Promise<ScheduledExam> {
  const response = await api.patch<{ data: ScheduledExam }>(`/api/v1/exams/${examId}/status`, { status });
  return response.data.data;
}

export async function createExamSchedule(request: CreateExamScheduleRequest): Promise<CreateExamBatchResponse> {
  const response = await api.post<{ data: CreateExamBatchResponse }>("/api/v1/exams", request);
  return response.data.data;
}

export interface DraftComponent {
  subjectComponentId: number;
  componentName: string;
  componentCode: string;
  displayOrder: number;
}

export interface DraftSubject {
  classSubjectId: number;
  subjectName: string;
  subjectCode: string;
  components: DraftComponent[];
}

export interface DraftScheduleResponse {
  examId: number;
  subjects: DraftSubject[];
}

export interface SavedComponentData {
  subjectComponentId: number;
  componentName: string;
  componentCode: string;
  displayOrder: number;
  maxMarks: number;
  passMarks: number;
  examDate: string;
  examStartTime: string;  // renamed from examTime
  examEndTime: string;    // new
  durationMinutes: number; // read-only, derived by backend
}

export interface SavedSubjectData {
  classSubjectId: number;
  subjectName: string;
  subjectCode: string;
  passMarks: number;
  components: SavedComponentData[];
}

export interface SavedExamScheduleResponse {
  examId: number;
  name: string;
  startDate: string;
  endDate: string;
  subjects: SavedSubjectData[];
}

export interface BulkSaveScheduleRequest {
  subjects: {
    classSubjectId: number;
    passMarks: number;
    components: {
      subjectComponentId: number;
      maxMarks: number;
      passMarks?: number;
      examDate: string;
      examStartTime: string; // renamed from examTime
      examEndTime: string;   // new — replaces durationMinutes
    }[];
  }[];
}

export async function getDraftScheduleMatrix(examId: number): Promise<DraftScheduleResponse> {
  const response = await api.get<{ data: DraftScheduleResponse }>(`/api/v1/exams/${examId}/draft-schedule`);
  return response.data.data;
}

export async function getSavedExamSchedule(examId: number): Promise<SavedExamScheduleResponse> {
  const response = await api.get<{ data: SavedExamScheduleResponse }>(`/api/v1/exams/${examId}/saved-schedule`);
  return response.data.data;
}

export async function bulkSaveExamSchedule(examId: number, request: BulkSaveScheduleRequest): Promise<void> {
  await api.post(`/api/v1/exams/${examId}/bulk-schedule`, request);
}

export async function updateExamHeader(
  examId: number,
  request: {
    name?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ScheduledExam> {
  const response = await api.patch<{ data: ScheduledExam }>(`/api/v1/exams/${examId}`, request);
  return response.data.data;
}

export async function getExamDetails(examId: number): Promise<any> {
  const response = await api.get(`/api/v1/exams/${examId}/details`);
  return response.data.data;
}

export async function publishExam(examId: number): Promise<ScheduledExam> {
  const response = await api.post<{ data: ScheduledExam }>(`/api/v1/exams/${examId}/publish`);
  return response.data.data;
}

export async function unpublishExam(examId: number): Promise<ScheduledExam> {
  const response = await api.post<{ data: ScheduledExam }>(`/api/v1/exams/${examId}/unpublish`);
  return response.data.data;
}

export async function markCompleted(examId: number): Promise<ScheduledExam> {
  const response = await api.post<{ data: ScheduledExam }>(`/api/v1/exams/${examId}/mark-completed`);
  return response.data.data;
}

export async function cancelExam(examId: number): Promise<void> {
  await api.post(`/api/v1/exams/${examId}/cancel`);
}

export async function startEvaluation(examId: number): Promise<ScheduledExam> {
  const response = await api.post<{ data: ScheduledExam }>(`/api/v1/exams/${examId}/start-evaluation`);
  return response.data.data;
}