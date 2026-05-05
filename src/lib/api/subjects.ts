import { api } from "./client";
import type { Subject } from "@/types/api";

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

export async function listSubjects() {
  const response = await api.get<ApiResponse<Subject[]>>("/api/master/subjects");
  return response.data.data;
}

export async function getSubject(id: string) {
  const response = await api.get<ApiResponse<Subject>>(`/api/master/subjects/${id}`);
  return response.data.data;
}

export async function createSubject(payload: { name: string; code: string }) {
  const response = await api.post<ApiResponse<Subject>>("/api/master/subjects", payload);
  return response.data.data;
}

export async function deleteSubject(id: string) {
  await api.delete(`/api/master/subjects/${id}`);
}

export async function listSubjectOptions() {
  const response = await api.get<ApiResponse<{ id: string; name: string }[]>>("/api/master/options/subjects");
  return response.data.data;
}
