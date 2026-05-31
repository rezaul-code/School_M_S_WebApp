import { api } from "./client";

import type {
  ApiResponse,
  InitialPayment,
  Page,
  Student,
  StudentFeeSummary,
} from "@/types/api";

// ✅ PRODUCTION FIX: Exact parameter matching with Spring Boot Controller
export interface ListStudentsParams {
  page?: number;
  size?: number;
  search?: string;
  classSectionId?: string | number; // <-- FIXED: Must be classSectionId
  academicYearId?: string | number;
  classLevelId?: string | number;
  status?: string;
}

export async function listStudents(params: ListStudentsParams) {
  const response = await api.get<ApiResponse<Page<Student>>>("/api/students", {
    params,
  });
  return response.data.data;
}

export async function getStudent(id: string) {
  const response = await api.get<ApiResponse<Student>>(`/api/students/${id}`);
  return response.data.data;
}

export interface AdmitStudentPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  transactionReference?: string;
  classSectionId: string;
  initialPayments: InitialPayment[];
  
  // Demographics
  gender: string;
  religion?: string;
  bloodGroup?: string;
}

export async function admitStudent(payload: AdmitStudentPayload) {
  const response = await api.post<ApiResponse<any>>(
    "/api/students/admit",
    payload,
  );
  return response.data.data;
}

export async function getFormOptions() {
  const response = await api.get<ApiResponse<Record<string, unknown>>>(
    "/api/students/form-options",
  );
  return response.data.data;
}

export async function getStudentFeeSummary(
  studentId: string,
  academicYearId: number | string,
) {
  const response = await api.get<ApiResponse<StudentFeeSummary>>(
    `/api/students/${studentId}/fees`,
    { params: { academicYearId: Number(academicYearId) } },
  );

  const data = response.data.data;
  if (data && !Array.isArray(data.rows)) {
    console.warn("[getStudentFeeSummary] rows field missing or not an array:", data);
    (data as any).rows = [];
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────
// TC & FINANCIAL CLEARANCE INTEGRATIONS
// ─────────────────────────────────────────────────────────────────────────

export interface FeeLedgerRowResponse {
  id: number;
  feeType: string;
  period: string | null;
  gross: number;
  discount: number;
  discountReason: string | null;
  netDue: number;
  amountPaid: number;
  balance: number;
  dueDate: string;
  status: 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING' | 'CREDIT' | 'DEBIT';
  waived: boolean;
}

export interface ExitClearancePreviewResponse {
  cleared: boolean;
  grossPendingDues: number;
  grossAdvancePool: number;
  pendingDuesToClear: number;
  futureFeesToCancel: number;
  advanceToRefund: number;
  pendingLineItems: FeeLedgerRowResponse[];
}

export interface TransferCertificateResponse {
  studentId: string;
  registrationNo: string;
  studentName: string;
  guardianName: string;
  dateOfBirth: string;
  admissionDate: string;
  leavingDate: string;
  lastClassAttended: string;
  academicOutcome: 'TC_ISSUED' | 'DROPPED_OUT';
  financialDuesCleared: boolean;
  issueDate: string;
}

export async function getExitClearancePreview(studentId: string, exitDate?: string) {
  const response = await api.get<ApiResponse<ExitClearancePreviewResponse>>(
    `/api/students/${studentId}/exit-preview`,
    { params: exitDate ? { exitDate } : {} }
  );
  return response.data.data;
}

export async function processStudentExitPermanently(
  studentId: string,
  exitReason: "TC_ISSUED" | "DROPPED_OUT",
  exitDate?: string
) {
  const response = await api.post<ApiResponse<void>>(
    `/api/students/${studentId}/exit`,
    null,
    { params: { exitReason, ...(exitDate && { exitDate }) } }
  );
  return response.data;
}

export async function getTransferCertificateData(studentId: string) {
  const response = await api.get<ApiResponse<TransferCertificateResponse>>(
    `/api/students/${studentId}/transfer-certificate`
  );
  return response.data.data;
}

export async function processSettlementPayment(studentId: string, amount: number, paymentMethod: string = "CASH") {
  const response = await api.post<ApiResponse<void>>(
    `/api/accounting/fee-collections/settle-tc-dues`,
    { studentId, amount, paymentMethod }
  );
  return response.data;
}

export async function getGenderOptions(): Promise<string[]> {
  const response = await api.get<ApiResponse<string[]>>("/api/options/genders");
  return response.data.data;
}

export async function getReligionOptions(): Promise<string[]> {
  const response = await api.get<ApiResponse<string[]>>("/api/options/religions");
  return response.data.data;
}

export async function getBloodGroupOptions(): Promise<string[]> {
  const response = await api.get<ApiResponse<string[]>>("/api/options/blood-groups");
  return response.data.data;
}