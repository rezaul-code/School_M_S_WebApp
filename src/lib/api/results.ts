// src/lib/api/results.ts
import { api } from "./client";

export interface BulkResultResponse {
  successCount: number;
  failedCount: number;
  errors: string[];
}

export interface StudentResultSummaryResponse {
  resultId: number;
  enrollmentId: number;
  studentId: string;
  studentName: string;
  registrationNo: string;
  academicYearName: string;
  className: string;
  percentage: number;
  grade: string;
  gpa: number;
  resultStatus: "PASS" | "FAIL" | "ABSENT" | "WITHHELD";
  classRank?: number;
  sectionRank?: number;
  calculatedAt: string;
  published: boolean;
}

export async function calculateBulk(academicYearId: number, classLevelId: number, assignRanks: boolean = true): Promise<BulkResultResponse> {
  const response = await api.post<{ data: BulkResultResponse }>("/api/v1/results/calculate/bulk", {
    academicYearId,
    classLevelId,
    assignRanks
  });
  return response.data.data;
}

export async function assignRanks(academicYearId: number, classLevelId: number): Promise<void> {
  await api.post(`/api/v1/results/rank?academicYearId=${academicYearId}&classLevelId=${classLevelId}`);
}

export async function getClassResults(academicYearId: number, classLevelId: number): Promise<StudentResultSummaryResponse[]> {
  // Your backend might require a specific endpoint for ALL results vs PUBLISHED results. 
  // Based on your controller, let's use a generic fetch if you have one, or the published one.
  const response = await api.get<{ data: StudentResultSummaryResponse[] }>(
    `/api/v1/results/class?academicYearId=${academicYearId}&classLevelId=${classLevelId}`
  );
  return response.data.data;
}

export async function publishResult(enrollmentId: number): Promise<void> {
  await api.post(`/api/v1/results/enrollment/${enrollmentId}/publish`);
}

export async function unpublishResult(enrollmentId: number): Promise<void> {
  await api.post(`/api/v1/results/enrollment/${enrollmentId}/unpublish`);
}

export async function clearClassResults(academicYearId: number, classLevelId: number): Promise<void> {
  await api.delete(`/api/v1/results/class?academicYearId=${academicYearId}&classLevelId=${classLevelId}`);
}

export async function getReportCard(enrollmentId: number): Promise<any> {
  const response = await api.get(`/api/v1/results/enrollment/${enrollmentId}`);
  return response.data.data;
}