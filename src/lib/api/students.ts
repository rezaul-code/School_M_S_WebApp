import { api } from "./client";
import type { Page, Student } from "@/types/api";

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

export interface ListStudentsParams {
  page?: number;
  size?: number;
  search?: string;
  classSectionId?: string;
  academicYearId?: string;
}

export async function listStudents(params: ListStudentsParams) {
  const response = await api.get<ApiResponse<Page<Student>>>("/api/students", { params });
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
  admissionDate?: string;
  classSectionId: string;
}

export async function admitStudent(payload: AdmitStudentPayload) {
  const response = await api.post<ApiResponse<Student>>("/api/students/admit", payload);
  return response.data.data;
}

export async function getFormOptions() {
  const response = await api.get<ApiResponse<Record<string, unknown>>>("/api/students/form-options");
  return response.data.data;
}
