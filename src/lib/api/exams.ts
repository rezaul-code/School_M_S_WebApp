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

/**
 * Fetch all registered master exam types
 */
export async function getAllExamTypes(): Promise<ExamType[]> {
  const response = await api.get<{ data: ExamType[] }>("/api/v1/exam-types");
  return response.data.data;
}

/**
 * Register a new master exam type category row
 */
export async function createExamType(request: CreateExamTypeRequest): Promise<ExamType> {
  const response = await api.post<{ data: ExamType }>("/api/v1/exam-types", request);
  return response.data.data;
}