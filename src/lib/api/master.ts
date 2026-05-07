import { api } from "./client";
import type { 
  ApiResponse, 
  AcademicYear, 
  ClassLevel, 
  Section, 
  ClassSubjectMapping, 
  Subject, 
  ClassSection 
} from "@/types/api";

// ─────────────────────────────────────────────────
// Academic Years
// ─────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────
// Class Levels
// ─────────────────────────────────────────────────

export async function getClassLevelOptions() {
  const response = await api.get<ApiResponse<ClassLevel[]>>("/api/master/options/class-levels");
  return response.data.data;
}

export async function createClassLevel(payload: {
  name: string;
  displayName: string;
}) {
  const response = await api.post<ApiResponse<ClassLevel>>("/api/master/class-levels", payload);
  return response.data.data;
}

// ─────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────

export async function getSectionOptions() {
  const response = await api.get<ApiResponse<Section[]>>("/api/master/options/sections");
  return response.data.data;
}

export async function createSection(payload: {
  name: string;
  displayName: string;
}) {
  const response = await api.post<ApiResponse<Section>>("/api/master/sections", payload);
  return response.data.data;
}

// ─────────────────────────────────────────────────
// Subjects
// ─────────────────────────────────────────────────

export async function createSubject(payload: {
  name: string;
  code: string;
}) {
  const response = await api.post<ApiResponse<Subject>>("/api/master/subjects", payload);
  return response.data.data;
}

// ─────────────────────────────────────────────────
// Curriculum / Class-Subjects
// ─────────────────────────────────────────────────

export async function createClassSubject(payload: {
  classLevelId: number;
  subjectId: number;
}) {
  const response = await api.post<ApiResponse<ClassSubjectMapping>>("/api/master/class-subjects", payload);
  return response.data.data;
}

// ─────────────────────────────────────────────────
// Class-Sections (Mappings)
// ─────────────────────────────────────────────────

export async function listClassSections() {
  const response = await api.get<ApiResponse<ClassSection[]>>("/api/master/class-sections");
  return response.data.data;
}

export async function createClassSection(payload: {
  classLevelId: number;
  sectionId: number;
  academicYearId: number;
}) {
  const response = await api.post<ApiResponse<ClassSection>>("/api/master/class-sections", {
    classLevelId: Number(payload.classLevelId),
    sectionId: Number(payload.sectionId),
    academicYearId: Number(payload.academicYearId),
  });
  return response.data.data;
}

// Keeping this around just in case you still rely on it in other parts of the app
export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => `CLASS_${i + 1}`);