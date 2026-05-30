// classSubjects.ts
import { api } from "./client";
import type { ClassSubjectMapping, ApiResponse } from "@/types/api";

export async function createClassSubject(payload: {
  classLevelId: number;
  subjectId: number;
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

// ✅ Added: filter mappings by class level
export async function getClassSubjectsByClass(classLevelId: number) {
  const response = await api.get<ApiResponse<ClassSubjectMapping[]>>(
    `/api/master/class-subjects?classLevelId=${classLevelId}`
  );
  return response.data.data;
}

export async function getClassSubjectById(id: number | string) {
  const response = await api.get<ApiResponse<ClassSubjectMapping>>(
    `/api/master/class-subjects/${id}`
  );
  return response.data.data;
}

export async function deleteClassSubject(id: number | string) {
  const response = await api.delete<ApiResponse<null>>(
    `/api/master/class-subjects/${id}`
  );
  return response.data;
}