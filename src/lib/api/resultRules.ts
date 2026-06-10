import { api } from "./client";

// ADD: New response type for consolidated subject rules
export interface ConsolidatedSubjectRuleResponse {
  id: number;
  classSubjectId: number;
  subjectName: string;
  consolidatedMaxMarks: number;
  consolidatedPassMarks: number;
}

// ADD: New request type
export interface SaveConsolidatedSubjectsRequest {
  subjects: {
    classSubjectId: number;
    consolidatedMaxMarks: number;
    consolidatedPassMarks: number;
  }[];
}

export interface ResultRuleSubjectResponse {
  id: number;
  classSubjectId: number;
  subjectName: string;
  // SUMMATION mode → raw max marks total  (e.g. 50 for English in UT1)
  // WEIGHTED mode  → always 100 (percentage scale)
  targetMaxMarks: number;
  // SUMMATION mode → raw pass marks       (e.g. 17 out of 50)
  // WEIGHTED mode  → pass percentage      (e.g. 33 out of 100%)
  minPassMarks: number;
}

export interface ResultRuleComponentResponse {
  id: number;
  examTypeId: number;
  examTypeName: string;
  examTypeCode: string;
  weightagePercent: number;
  mandatoryPass: boolean;
  subjectRules?: ResultRuleSubjectResponse[]; // Nested here now!
}

export interface ResultRuleResponse {
  id: number;
  name: string;
  academicYearId: number;
  academicYearName: string;
  classLevelId: number;
  classLevelName: string;
  strategyType: "WEIGHTED_AVERAGE" | "SUMMATION";
  gradingSchemeId: number;
  gradingSchemeName: string;
  promotionMinPercent: number;        // keep for backward compat, not shown in UI
  applyGraceMarks: boolean;
  totalWeightage: number;
  components: ResultRuleComponentResponse[];
  consolidatedSubjectRules: ConsolidatedSubjectRuleResponse[]; // NEW
  isLocked: boolean;
}
// UPDATE: CreateResultRuleRequest — make promotionMinPercent optional
export interface CreateResultRuleRequest {
  name: string;
  academicYearId: number;
  classLevelId: number;
  strategyType: "WEIGHTED_AVERAGE" | "SUMMATION";
  gradingSchemeId: number;
  promotionMinPercent?: number;       // optional now
  applyGraceMarks: boolean;
}

export interface AddRuleComponentRequest {
  examTypeId: number;
  weightagePercent: number;
  mandatoryPass: boolean;
}

export interface BulkSaveSubjectsRequest {
  components: {
    componentId: number;
    subjects: {
      classSubjectId: number;
      consolidatedMaxMarks: number;
      consolidatedPassMarks: number;
    }[];
  }[];
}

// ADD: New API function
export async function saveConsolidatedSubjects(
  ruleId: number,
  request: SaveConsolidatedSubjectsRequest
): Promise<void> {
  await api.post(
    `/api/v1/result-rules/${ruleId}/consolidated-subjects`,
    request
  );
}

export async function getResultRule(
  academicYearId: number,
  classLevelId: number
): Promise<ResultRuleResponse | null> {
  try {
    const response = await api.get<{ data: ResultRuleResponse[] }>(
      `/api/v1/result-rules?academicYearId=${academicYearId}`
    );
    const rule = response.data.data.find(r => r.classLevelId === classLevelId);
    return rule || null;
  } catch {
    return null;
  }
}

export async function getRulesByYear(
  academicYearId: number
): Promise<ResultRuleResponse[]> {
  const response = await api.get<{ data: ResultRuleResponse[] }>(
    `/api/v1/result-rules?academicYearId=${academicYearId}`
  );
  return response.data.data;
}

export async function createResultRule(
  request: CreateResultRuleRequest
): Promise<ResultRuleResponse> {
  const response = await api.post<{ data: ResultRuleResponse }>(
    "/api/v1/result-rules",
    request
  );
  return response.data.data;
}

export async function addRuleComponent(
  ruleId: number,
  request: AddRuleComponentRequest
): Promise<ResultRuleResponse> {
  const response = await api.post<{ data: ResultRuleResponse }>(
    `/api/v1/result-rules/${ruleId}/components`,
    request
  );
  return response.data.data;
}

export async function removeRuleComponent(componentId: number): Promise<void> {
  await api.delete(`/api/v1/result-rules/components/${componentId}`);
}

export async function deleteResultRule(ruleId: number): Promise<void> {
  await api.delete(`/api/v1/result-rules/${ruleId}`);
}

export async function bulkSaveRuleSubjects(
  request: BulkSaveSubjectsRequest
): Promise<void> {
  await api.post(`/api/v1/result-rules/subjects/bulk`, request);
}

export async function getClassSubjects(classLevelId: number): Promise<any[]> {
  const res = await api.get(`/api/master/class-subjects`, {
    params: { classLevelId }
  });
  return res.data.data;
}