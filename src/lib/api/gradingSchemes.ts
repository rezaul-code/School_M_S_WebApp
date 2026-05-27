import { api } from "./client";

export interface GradeScaleResponse {
  id: number;
  gradeLabel: string;
  minPercent: number;
  maxPercent: number;
  gradePoint?: number;
  description?: string;
  pass: boolean;
}

export interface GradingSchemeResponse {
  id: number;
  name: string;
  description: string;
  default: boolean;
  gradeScales: GradeScaleResponse[];
}

export interface CreateGradingSchemeRequest {
  name: string;
  description?: string;
  default: boolean;
}

export interface AddGradeScaleRequest {
  gradeLabel: string;
  minPercent: number;
  maxPercent: number;
  gradePoint?: number;
  description?: string;
  pass: boolean;
}

export async function getAllGradingSchemes(): Promise<GradingSchemeResponse[]> {
  const response = await api.get<{ data: GradingSchemeResponse[] }>("/api/v1/grading-schemes");
  return response.data.data;
}

export async function createGradingScheme(request: CreateGradingSchemeRequest): Promise<GradingSchemeResponse> {
  const response = await api.post<{ data: GradingSchemeResponse }>("/api/v1/grading-schemes", request);
  return response.data.data;
}

export async function addGradeScale(schemeId: number, request: AddGradeScaleRequest): Promise<GradingSchemeResponse> {
  const response = await api.post<{ data: GradingSchemeResponse }>(`/api/v1/grading-schemes/${schemeId}/grade-scales`, request);
  return response.data.data;
}

export async function removeGradeScale(gradeScaleId: number): Promise<void> {
  await api.delete(`/api/v1/grading-schemes/grade-scales/${gradeScaleId}`);
}

export async function setSchemeAsDefault(schemeId: number): Promise<GradingSchemeResponse> {
  const response = await api.patch<{ data: GradingSchemeResponse }>(`/api/v1/grading-schemes/${schemeId}/set-default`);
  return response.data.data;
}