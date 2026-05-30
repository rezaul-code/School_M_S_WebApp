// src/lib/api/tcCertificates.ts

import { api } from './client';
import type { ApiResponse, Page } from '@/types/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TcStudentSummary {
  id: string;
  fullName: string;
  rollNumber: string;
  classSectionName: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | 'TRANSFERRED' | 'SUSPENDED';
  active: boolean;
  admissionDate: string;
  academicYear: string;
}

export interface GetTcStudentsParams {
  classLevelId?: number;
  classSectionId?: number;
  search?: string;
  status?: string;
  page?: number;
  size?: number;
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

// ── API Functions ─────────────────────────────────────────────────────────────

export async function getTcStudents(params: GetTcStudentsParams): Promise<Page<TcStudentSummary>> {
  // Was: '/api/students'
  const res = await api.get<ApiResponse<Page<TcStudentSummary>>>('/api/students/tc-list', { params });
  return res.data.data;
}

export async function getExitClearancePreview(studentId: string, exitDate?: string): Promise<ExitClearancePreviewResponse> {
  const res = await api.get<ApiResponse<ExitClearancePreviewResponse>>(
    `/api/students/${studentId}/exit-preview`,
    { params: exitDate ? { exitDate } : {} }
  );
  return res.data.data;
}

export async function processStudentExitPermanently(
  studentId: string,
  exitReason: 'TC_ISSUED' | 'DROPPED_OUT',
  exitDate?: string
): Promise<void> {
  await api.post(
    `/api/students/${studentId}/exit`,
    null,
    { params: { exitReason, ...(exitDate && { exitDate }) } }
  );
}

export async function getTransferCertificateData(studentId: string): Promise<TransferCertificateResponse> {
  const res = await api.get<ApiResponse<TransferCertificateResponse>>(
    `/api/students/${studentId}/transfer-certificate`
  );
  return res.data.data;
}

export async function processSettlementPayment(
  studentId: string,
  amount: number,
  paymentMethod: string = 'CASH'
): Promise<void> {
  await api.post('/api/accounting/fee-collections/settle-tc-dues', {
    studentId,
    amount,
    paymentMethod,
  });
}