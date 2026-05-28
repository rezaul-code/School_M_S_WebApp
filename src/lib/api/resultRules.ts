import { api } from "./client";
import { GradingSchemeResponse } from "./gradingSchemes";

export interface ResultRuleComponentResponse {
  id: number;
  examTypeId: number;
  examTypeName: string;
  examTypeCode: string;
  weightagePercent: number;
  mandatoryPass: boolean; // Jackson strips the "is" prefix
}

export interface ResultRuleResponse {
  id: number;
  name: string;
  academicYearId: number;
  academicYearName: string;
  classLevelId: number;
  classLevelName: string;
  gradingSchemeId: number;
  gradingSchemeName: string;
  promotionMinPercent: number;
  applyGraceMarks: boolean; // Jackson strips the "is" prefix
  totalWeightage: number;
  components: ResultRuleComponentResponse[];
}

export interface CreateResultRuleRequest {
  name: string;
  academicYearId: number;
  classLevelId: number;
  gradingSchemeId: number;
  promotionMinPercent: number;
  applyGraceMarks: boolean;
}

export interface AddRuleComponentRequest {
  examTypeId: number;
  weightagePercent: number;
  mandatoryPass: boolean;
}

export async function getResultRule(academicYearId: number, classLevelId: number): Promise<ResultRuleResponse | null> {
  try {
    // We expect this to return a list based on your backend controller, but filtered by class it should be 1
    const response = await api.get<{ data: ResultRuleResponse[] }>(
      `/api/v1/result-rules?academicYearId=${academicYearId}`
    );
    // Find the specific class
    const rule = response.data.data.find(r => r.classLevelId === classLevelId);
    return rule || null;
  } catch (error: any) {
    return null;
  }
}

// Fetch all rules for a specific year (useful for cloning)
export async function getRulesByYear(academicYearId: number): Promise<ResultRuleResponse[]> {
  const response = await api.get<{ data: ResultRuleResponse[] }>(`/api/v1/result-rules?academicYearId=${academicYearId}`);
  return response.data.data;
}

export async function createResultRule(request: CreateResultRuleRequest): Promise<ResultRuleResponse> {
  const response = await api.post<{ data: ResultRuleResponse }>("/api/v1/result-rules", request);
  return response.data.data;
}

export async function addRuleComponent(ruleId: number, request: AddRuleComponentRequest): Promise<ResultRuleResponse> {
  const response = await api.post<{ data: ResultRuleResponse }>(`/api/v1/result-rules/${ruleId}/components`, request);
  return response.data.data;
}

export async function removeRuleComponent(componentId: number): Promise<void> {
  await api.delete(`/api/v1/result-rules/components/${componentId}`);
}

export async function deleteResultRule(ruleId: number): Promise<void> {
  await api.delete(`/api/v1/result-rules/${ruleId}`);
}