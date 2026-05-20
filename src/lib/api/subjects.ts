import { api } from "./client";
import type { Subject, ApiResponse } from "@/types/api";

// Strong structural definition matching the updated form data payload
export interface CreateSubjectPayload {
  name: string;
  code: string;
  components: {
    name: string;
    code: string;
    displayOrder: number;
  }[];
}

export async function listSubjects(): Promise<Subject[]> {
  const response = await api.get<ApiResponse<Subject[]>>("/api/master/subjects");
  return response.data.data;
}

export async function getSubject(id: string): Promise<Subject> {
  const response = await api.get<ApiResponse<Subject>>(`/api/master/subjects/${id}`);
  return response.data.data;
}

// FIXED: Accepts the payload structure required by the new backend
export async function createSubject(payload: CreateSubjectPayload): Promise<Subject> {
  const response = await api.post<ApiResponse<Subject>>("/api/master/subjects", payload);
  return response.data.data;
}

export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/api/master/subjects/${id}`);
}

export async function listSubjectOptions(): Promise<Subject[]> {
  const response = await api.get<ApiResponse<Subject[]>>("/api/master/options/subjects");
  return response.data.data;
}