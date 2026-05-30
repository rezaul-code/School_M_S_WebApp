// src/lib/api/studentFeeStatement.ts
// Add this file (or merge into payFee.ts / a new fees.ts)

import { api } from './client';
import type { ApiResponse } from '@/types/api';

export interface StatementLineItem {
  ledgerId: number;
  feeType: string;
  feeTypeLabel: string;
  period?: string;
  dueDate: string;          // ISO date string
  grossAmount: number;
  discount: number;
  discountReason?: string;
  netDue: number;
  amountPaid: number;
  balance: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'WAIVED' | 'TRANSFER_CREDIT';
  waived: boolean;
}

export interface StudentFeeStatementResponse {
  // Student identity
  studentId: string;
  studentName: string;
  registrationNo: string;
  rollNumber?: string;
  classSectionName: string;
  parentName?: string;
  parentContact?: string;
  studentStatus: string;

  // Academic year
  academicYearId: number;
  academicYearName: string;
  statementPeriod: string;

  // Financial summary
  grossAmount: number;
  totalDiscount: number;
  netAmount: number;
  totalPaid: number;
  totalPartial: number;
  totalPending: number;
  totalOverdue: number;
  balanceDue: number;

  // Line items
  lineItems: StatementLineItem[];

  // Metadata
  generatedBy: string;
  generatedOn: string;     // ISO date string
  referenceNo: string;
}

export async function getStudentFeeStatement(
  studentId: string,
  academicYearId: number
): Promise<StudentFeeStatementResponse> {
  const res = await api.get<ApiResponse<StudentFeeStatementResponse>>(
    `/api/students/${studentId}/fees/statement`,
    { params: { academicYearId } }
  );
  return res.data.data;
}