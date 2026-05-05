import { api } from "./client";
import type { ClassSubjectMapping } from "@/types/api";

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

export async function createClassSubject(payload: {
  className: string;
  subjectId: string;
}) {
  const response = await api.post<ApiResponse<ClassSubjectMapping>>(
    "/api/master/class-subjects",
    payload
  );
  return response.data.data;
}

export async function getAllClassSubjects() {
  const response = await api.get<ApiResponse<ClassSubjectMapping[]>>(
    "/api/master/class-subjects"
  );
  return response.data.data;
}

export async function getClassSubjectById(id: string) {
  const response = await api.get<ApiResponse<ClassSubjectMapping>>(
    `/api/master/class-subjects/${id}`
  );
  return response.data.data;
}

export async function deleteClassSubject(id: string) {
  await api.delete(`/api/master/class-subjects/${id}`);
}
