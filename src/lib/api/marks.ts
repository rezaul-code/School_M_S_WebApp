import { api } from "./client";

// ─── Request Types (from new file) ───────────────────────────────────────────

export interface MarkComponentRequest {
  examSubjectComponentId: number;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string;
}

export interface EnterMarkRequest {
  enrollmentId: number;
  examSubjectId: number;
  isAbsent: boolean;
  isExempted: boolean;
  remarks: string;
  enteredByUserId: string;
  components: MarkComponentRequest[];
}

// ─── Response Types (from original file — richer shape) ──────────────────────

export interface MarkComponentResponse {
  id: number;
  examSubjectComponentId: number;
  componentName: string;
  marksObtained: number | null;
  maxMarks: number;
  passMarks: number | null;
  isAbsent: boolean;
  remarks: string | null;
}

export type MarkStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "LOCKED" | "REJECTED";

export interface StudentMarkResponse {
  id: number;
  enrollmentId: number;
  studentName: string;
  rollNumber: string;
  sectionName: string;
  examSubjectId: number;
  subjectName: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  isAbsent: boolean;
  isExempted: boolean;
  status: MarkStatus;
  remarks: string | null;
  enteredByEmail: string | null;
  approvedByEmail: string | null;
  approvedAt: string | null;
  lockedAt: string | null;
  components: MarkComponentResponse[];
}

// Group all subject marks for one student into one row
export interface StudentMarksRow {
  enrollmentId: number;
  studentName: string;
  rollNumber: string;
  sectionName: string;
  subjects: {
    [subjectName: string]: StudentMarkResponse;
  };
  overallStatus: MarkStatus; // worst-case status across subjects
  totalObtained: number;
  totalMax: number;
}

// ─── API: Mark Entry (from new file) ─────────────────────────────────────────

// POST /api/v1/marks/bulk-save
export async function bulkSaveMarks(requests: EnterMarkRequest[]): Promise<StudentMarkResponse[]> {
  const res = await api.post<{ data: StudentMarkResponse[] }>("/api/v1/marks/bulk-save", requests);
  return res.data.data;
}

// PATCH /api/v1/marks/exam-subject/{examSubjectId}/bulk-submit
export async function bulkSubmitMarks(examSubjectId: number, userId: string): Promise<void> {
  await api.patch(`/api/v1/marks/exam-subject/${examSubjectId}/bulk-submit`, { userId });
}

// ─── API: Mark Retrieval ──────────────────────────────────────────────────────

// GET /api/v1/marks/exam/{examId} — lightweight, no components
export async function getMarksByExam(examId: number): Promise<StudentMarkResponse[]> {
  const res = await api.get<{ data: StudentMarkResponse[] }>(
    `/api/v1/marks/exam/${examId}`
  );
  return res.data.data;
}

// GET /api/v1/marks/exam/{examId}/with-components — full breakdown
export async function getMarksByExamWithComponents(
  examId: number
): Promise<StudentMarkResponse[]> {
  const res = await api.get<{ data: StudentMarkResponse[] }>(
    `/api/v1/marks/exam/${examId}/with-components`
  );
  return res.data.data;
}

// GET /api/v1/marks/exam/{examId}/pending-count
export async function getPendingApprovalCount(examId: number): Promise<number> {
  const res = await api.get<{ data: number }>(
    `/api/v1/marks/exam/${examId}/pending-count`
  );
  return res.data.data;
}

// ─── API: Mark Approval ───────────────────────────────────────────────────────

// PATCH /api/v1/marks/{markId}/approve
export async function approveMark(
  markId: number,
  adminUserId: string
): Promise<StudentMarkResponse> {
  const res = await api.patch<{ data: StudentMarkResponse }>(
    `/api/v1/marks/${markId}/approve`,
    null,
    { params: { adminUserId } }
  );
  return res.data.data;
}

// PATCH /api/v1/marks/{markId}/reject
export async function rejectMark(
  markId: number,
  rejectionReason: string,
  adminUserId: string
): Promise<StudentMarkResponse> {
  const res = await api.patch<{ data: StudentMarkResponse }>(
    `/api/v1/marks/${markId}/reject`,
    { rejectionReason, adminUserId }
  );
  return res.data.data;
}

// PATCH /api/v1/marks/exam/{examId}/bulk-approve
export async function bulkApproveMarks(
  examId: number,
  adminUserId: string
): Promise<StudentMarkResponse[]> {
  const res = await api.patch<{ data: StudentMarkResponse[] }>(
    `/api/v1/marks/exam/${examId}/bulk-approve`,
    { userId: adminUserId }
  );
  return res.data.data;
}

// ─── API: Results ─────────────────────────────────────────────────────────────

// POST /api/v1/results/calculate/bulk
export async function bulkCalculateResults(
  academicYearId: number,
  classLevelId: number
): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
  const res = await api.post<{
    data: { successCount: number; failedCount: number; errors: string[] };
  }>("/api/v1/results/calculate/bulk", { academicYearId, classLevelId });
  return res.data.data;
}

// ─── Utility: group flat marks list into per-student rows ─────────────────────
// Called on the frontend after fetching from /with-components
// Groups by enrollmentId, creates one row per student with subject columns
export function groupMarksByStudent(marks: StudentMarkResponse[]): StudentMarksRow[] {
  const map = new Map<number, StudentMarksRow>();

  const statusPriority: Record<MarkStatus, number> = {
    REJECTED: 0,
    DRAFT: 1,
    SUBMITTED: 2,
    APPROVED: 3,
    LOCKED: 4,
  };

  for (const mark of marks) {
    if (!map.has(mark.enrollmentId)) {
      map.set(mark.enrollmentId, {
        enrollmentId: mark.enrollmentId,
        studentName: mark.studentName,
        rollNumber: mark.rollNumber,
        sectionName: mark.sectionName,
        subjects: {},
        overallStatus: mark.status,
        totalObtained: 0,
        totalMax: 0,
      });
    }
    const row = map.get(mark.enrollmentId)!;
    row.subjects[mark.subjectName] = mark;
    row.totalObtained += mark.totalMarksObtained ?? 0;
    row.totalMax += mark.totalMaxMarks ?? 0;

    // Keep worst-case status
    if (statusPriority[mark.status] < statusPriority[row.overallStatus]) {
      row.overallStatus = mark.status;
    }
  }

  return Array.from(map.values());
}