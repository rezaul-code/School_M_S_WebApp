import { api } from "./client";

import type {
  ApiResponse,
  InitialPayment,
  Page,
  Student,
  StudentFeeSummary,
} from "@/types/api";

export interface ListStudentsParams {
  page?: number;
  size?: number;
  search?: string;
  classSectionId?: string;
  academicYearId?: string;
  classLevelId?: string | number;
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
  
  // --- ADDED NEW FIELDS ---
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

/**
 * GET /api/students/{studentId}/fees?academicYearId={academicYearId}
 *
 * Returns a flat list of fee rows (one per fee record) plus year-level totals.
 * Each row carries `id` — the fee-record PK used in payment/discount/waive calls.
 *
 * academicYearId is always coerced to a number to guard against the
 * AcademicYear.id being typed as number|string and arriving as a string at runtime.
 */
export async function getStudentFeeSummary(
  studentId: string,
  academicYearId: number | string,
) {
  const response = await api.get<ApiResponse<StudentFeeSummary>>(
    `/api/students/${studentId}/fees`,
    { params: { academicYearId: Number(academicYearId) } },
  );

  const data = response.data.data;

  // Defensive: guarantee rows is always an array even if the backend
  // omits the field or returns null.
  if (data && !Array.isArray(data.rows)) {
    console.warn("[getStudentFeeSummary] rows field missing or not an array:", data);
    (data as any).rows = [];
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────
// TC & FINANCIAL CLEARANCE INTEGRATIONS (UPDATED & ADDED)
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
  // ADDED 'CREDIT' and 'DEBIT' to handle our new UI display flags from the backend
  status: 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING' | 'CREDIT' | 'DEBIT';
  waived: boolean;
}

export interface ExitClearancePreviewResponse {
  cleared: boolean;
  
  // NEW: Gross tracking for the Detailed Settlement Statement UI
  grossPendingDues: number;
  grossAdvancePool: number;
  
  // Existing Net Tracking
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

/**
 * GET /api/students/{studentId}/exit-preview
 * Previews upcoming liability cancellations and audits remaining unfulfilled obligations.
 */
export async function getExitClearancePreview(studentId: string, exitDate?: string) {
  const response = await api.get<ApiResponse<ExitClearancePreviewResponse>>(
    `/api/students/${studentId}/exit-preview`,
    { params: exitDate ? { exitDate } : {} }
  );
  return response.data.data;
}

/**
 * POST /api/students/{studentId}/exit
 * Disables credentials, terminates classroom placements, and wipes future liabilities.
 * This endpoint strictly fails if outstanding balances exist.
 */
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

/**
 * GET /api/students/{studentId}/transfer-certificate
 * Retrieves official verification and historical data mapped for a Transfer Certificate.
 */
export async function getTransferCertificateData(studentId: string) {
  const response = await api.get<ApiResponse<TransferCertificateResponse>>(
    `/api/students/${studentId}/transfer-certificate`
  );
  return response.data.data;
}

/**
 * POST /api/accounting/fee-collections/settle-tc-dues
 * Processes a real payment to clear remaining settlement dues before TC issuance.
 */
export async function processSettlementPayment(studentId: string, amount: number, paymentMethod: string = "CASH") {
  const response = await api.post<ApiResponse<void>>(
    `/api/accounting/fee-collections/settle-tc-dues`,
    { studentId, amount, paymentMethod }
  );
  return response.data;
}