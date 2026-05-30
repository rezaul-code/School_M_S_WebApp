import { api } from './client';
import type { ApiResponse } from '@/types/api';
import type { IdLabel } from './options';

export interface FeeLedgerRowResponse {
  id: number;
  feeType: string;
  period?: string;
  netDue: number;
  balance: number;
  status: string;
}

export interface PayFeeStudent {
  id: string;
  fullName: string;
  rollNumber: string;
  registrationNo: string;
  classSectionName: string;
  academicYear: string;
  status: string;
}

export interface StudentFeeLedgerResponse {
  studentId: string;
  academicYearId: number;
  grossDueYear: number;
  totalDiscount: number;
  netDueYear: number;
  collectedSoFar: number;
  balanceRemaining: number;
  overdue: number;
  rows: FeeLedgerRowResponse[];
}

export interface BulkPaymentRequest {
  paymentMode: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER';
  transactionReference?: string;
  remarks?: string;
  allocations: { ledgerId: number; amountPaid: number }[];
}

// Search students (reuse existing tc-list endpoint)
export async function searchPayFeeStudents(params: {
  classLevelId?: number;
  classSectionId?: number;
  search?: string;
  page?: number;
  size?: number;
}): Promise<{ content: PayFeeStudent[]; totalElements: number }> {
  const res = await api.get<ApiResponse<{ content: PayFeeStudent[]; totalElements: number }>>(
    '/api/students/tc-list',
    { params: { ...params, status: 'ACTIVE', size: params.size ?? 8 } }
  );
  return res.data.data;
}

// Load full fee ledger for active year
export async function getStudentFees(
  studentId: string,
  academicYearId: number
): Promise<StudentFeeLedgerResponse> {
  const res = await api.get<ApiResponse<StudentFeeLedgerResponse>>(
    `/api/students/${studentId}/fees`,
    { params: { academicYearId } }
  );
  return res.data.data;
}

// Bulk collect
export async function collectBulkPayment(
  studentId: string,
  request: BulkPaymentRequest
): Promise<FeeLedgerRowResponse[]> {
  const res = await api.post<ApiResponse<FeeLedgerRowResponse[]>>(
    `/api/students/${studentId}/fees/payments/bulk`,
    request
  );
  return res.data.data;
}