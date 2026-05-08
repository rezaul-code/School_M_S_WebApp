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
  classLevelId?: number;
  classSectionId?: number;
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

export interface UpdateTeacherPayload {
  phone?: string;
  address?: string;
}

export interface TeacherAssignment {
  id: number;
  teacherId: string;
  teacherName?: string;

  classLevelId?: number;
  className?: string;

  subjectId: number;
  subjectName?: string;
  subjectCode?: string;

  classSectionId?: number;
  classSectionName?: string;

  academicYear?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface AssignSubjectPayload {
  classLevelId: number;
  subjectId: number;
  classSectionId?: number;
}

export interface ClassLevelOption {
  id: number;
  name: string;
  displayName?: string;
}

export interface SubjectOption {
  id: number;
  name: string;
  code: string;
}

export interface SectionOption {
  id: number;
  name: string;
  displayName?: string;
}

// ======================================================
// TEACHERS
// ======================================================

export async function listTeachers(
  params: ListTeachersParams = {}
) {
  const response = await api.get<ApiResponse<Page<Teacher>>>(
    "/api/teachers",
    { params }
  );

  return response.data.data;
}

export async function getTeacher(id: string) {
  const response = await api.get<ApiResponse<Teacher>>(
    `/api/teachers/${id}`
  );

  return response.data.data;
}

export async function registerTeacher(
  payload: RegisterTeacherPayload
) {
  const response = await api.post<ApiResponse<Teacher>>(
    "/api/teachers",
    payload
  );

  return response.data.data;
}

export async function updateTeacher(
  id: string,
  payload: UpdateTeacherPayload
) {
  const response = await api.patch<ApiResponse<Teacher>>(
    `/api/teachers/${id}`,
    payload
  );

  return response.data.data;
}

export async function deactivateTeacher(id: string) {
  const response = await api.patch<ApiResponse<null>>(
    `/api/teachers/${id}/deactivate`,
    {}
  );

  return response.data;
}

export async function reactivateTeacher(id: string) {
  const response = await api.patch<ApiResponse<null>>(
    `/api/teachers/${id}/reactivate`,
    {}
  );

  return response.data;
}

// ======================================================
// ASSIGNMENTS
// ======================================================

export async function assignSubjectToTeacher(
  teacherId: string,
  payload: AssignSubjectPayload
) {
  const response = await api.post<ApiResponse<TeacherAssignment>>(
    `/api/teachers/${teacherId}/assignments`,
    payload
  );

  return response.data.data;
}

export async function getTeacherAssignments(
  teacherId: string
) {
  const response = await api.get<ApiResponse<TeacherAssignment[]>>(
    `/api/teachers/${teacherId}/assignments`
  );

  return response.data.data;
}

export async function removeTeacherAssignment(
  teacherId: string,
  assignmentId: number
) {
  const response = await api.delete<ApiResponse<null>>(
    `/api/teachers/${teacherId}/assignments/${assignmentId}`
  );

  return response.data;
}

// ======================================================
// DROPDOWNS
// ======================================================

export async function getClassLevels() {
  const response = await api.get<ApiResponse<ClassLevelOption[]>>(
    "/api/master/options/class-levels"
  );

  return response.data.data;
}

// When classLevelId is provided, returns only subjects mapped to that class
// via ClassSubject — matches what the backend validates on assignment
export async function getSubjects(classLevelId?: number) {
  const response = await api.get<ApiResponse<SubjectOption[]>>(
    "/api/master/options/subjects",
    { params: classLevelId ? { classLevelId } : {} }
  );

  return response.data.data;
}

export async function getSections() {
  const response = await api.get<ApiResponse<SectionOption[]>>(
    "/api/master/options/sections"
  );

  return response.data.data;
}

// Returns class sections for a specific class level, scoped to the active
// academic year — used by AssignSubjectDialog section dropdown
export async function getSectionsByClassLevel(classLevelId: number) {
  const response = await api.get<ApiResponse<SectionOption[]>>(
    "/api/master/options/class-sections",
    { params: { classLevelId } }
  );

  return response.data.data;
}