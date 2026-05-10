// src/lib/api/students.ts

import { api } from "./client";

import type {
  ApiResponse,
  InitialPayment,
  Page,
  Student,
  StudentFeeSummary,
} from "@/types/api";

export interface ListStudentsParams {
  page?: number;
  size?: number;
  search?: string;
  classSectionId?: string;
  academicYearId?: string;
}

export async function listStudents(params: ListStudentsParams) {
  const response = await api.get<ApiResponse<Page<Student>>>("/api/students", {
    params,
  });
  return response.data.data;
}

export async function getStudent(id: string) {
  const response = await api.get<ApiResponse<Student>>(`/api/students/${id}`);
  return response.data.data;
}

export interface AdmitStudentPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  transactionReference?: string;
  classSectionId: string;
  initialPayments: InitialPayment[];
}

export async function admitStudent(payload: AdmitStudentPayload) {
  const response = await api.post<ApiResponse<any>>(
    "/api/students/admit",
    payload,
  );
  return response.data.data;
}

export async function getFormOptions() {
  const response = await api.get<ApiResponse<Record<string, unknown>>>(
    "/api/students/form-options",
  );
  return response.data.data;
}

/**
 * GET /api/students/{studentId}/fees?academicYearId={academicYearId}
 *
 * Returns a flat list of fee rows (one per fee record) plus year-level totals.
 * Each row carries `id` — the fee-record PK used in payment/discount/waive calls.
 *
 * academicYearId is always coerced to a number to guard against the
 * AcademicYear.id being typed as number|string and arriving as a string at runtime.
 */
export async function getStudentFeeSummary(
  studentId: string,
  academicYearId: number | string,
) {
  const response = await api.get<ApiResponse<StudentFeeSummary>>(
    `/api/students/${studentId}/fees`,
    { params: { academicYearId: Number(academicYearId) } },
  );

  const data = response.data.data;

  // Defensive: guarantee rows is always an array even if the backend
  // omits the field or returns null.
  if (data && !Array.isArray(data.rows)) {
    console.warn("[getStudentFeeSummary] rows field missing or not an array:", data);
    (data as any).rows = [];
  }

  return data;
}