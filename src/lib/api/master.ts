import { api } from "./client";
import type { AcademicYear, ClassSection } from "@/types/api";

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

export async function listAcademicYears() {
  const response = await api.get<ApiResponse<AcademicYear[]>>("/api/master/academic-years");
  return response.data.data;
}

export async function createAcademicYear(payload: {
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
}) {
  const response = await api.post<ApiResponse<AcademicYear>>("/api/master/academic-years", payload);
  return response.data.data;
}

export async function listClassSections() {
  const response = await api.get<ApiResponse<ClassSection[]>>("/api/master/class-sections");
  return response.data.data;
}

export async function createClassSection(payload: {
  className: string;
  sectionName: string;
  academicYearId: string;
}) {
  const response = await api.post<ApiResponse<ClassSection>>("/api/master/class-sections", {
    ...payload,
    academicYearId: Number(payload.academicYearId), // ← fix: string → number
  });
  return response.data.data;
}

export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => `CLASS_${i + 1}`);