// src/lib/api/payments.ts

import { api } from "./client";
import type { ApiResponse } from "@/types/api";

// ── Types ─────────────────────────────────────────────────────────

export type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";

export interface RecordPaymentPayload {
  amountPaid: number;
  paymentMode: PaymentMode;
  transactionReference?: string;
  remarks?: string;
}

export interface ApplyDiscountPayload {
  discount: number;
  reason: string;
}

// ── API helpers ───────────────────────────────────────────────────

function assertFeeId(feeId: number, action: string): void {
  if (!feeId || isNaN(feeId)) {
    throw new Error(
      `Cannot ${action}: fee ID is missing or invalid (got ${feeId})`,
    );
  }
}

// ── Payments ──────────────────────────────────────────────────────

export async function recordPayment(
  studentId: string,
  feeId: number,
  payload: RecordPaymentPayload,
) {
  assertFeeId(feeId, "record payment");
  const response = await api.post<ApiResponse<{ id: number }>>(
    `/api/students/${studentId}/fees/${feeId}/payments`,
    payload,
  );
  return response.data.data;
}

// ── Discount ──────────────────────────────────────────────────────

export async function applyDiscount(
  studentId: string,
  feeId: number,
  payload: ApplyDiscountPayload,
) {
  assertFeeId(feeId, "apply discount");
  const response = await api.patch<ApiResponse<{ id: number }>>(
    `/api/students/${studentId}/fees/${feeId}/discount`,
    payload,
  );
  return response.data.data;
}

// ── Waive ─────────────────────────────────────────────────────────

export async function waiveFee(studentId: string, feeId: number) {
  assertFeeId(feeId, "waive fee");
  const response = await api.patch<ApiResponse<{ id: number }>>(
    `/api/students/${studentId}/fees/${feeId}/waive`,
  );
  return response.data.data;
}