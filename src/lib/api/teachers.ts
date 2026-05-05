import { api } from "./client";
import type { Page, Teacher } from "@/types/api";

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

export interface ListTeachersParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean;
}

export async function listTeachers(params: ListTeachersParams) {
  const response = await api.get<ApiResponse<Page<Teacher>>>("/api/teachers", { params });
  return response.data.data;
}

export async function getTeacher(id: string) {
  const response = await api.get<ApiResponse<Teacher>>(`/api/teachers/${id}`);
  return response.data.data;
}

export interface RegisterTeacherPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  joiningDate?: string;
}

export async function registerTeacher(payload: RegisterTeacherPayload) {
  const response = await api.post<ApiResponse<Teacher>>("/api/teachers", payload);
  return response.data.data;
}

export async function updateTeacher(id: string, payload: Partial<Pick<Teacher, "phone" | "address">>) {
  const response = await api.patch<ApiResponse<Teacher>>(`/api/teachers/${id}`, payload);
  return response.data.data;
}
