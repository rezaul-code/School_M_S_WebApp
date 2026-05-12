// src/lib/api/reports.ts

import { api } from "./client";
import type { ApiResponse } from "@/types/api";

/* =========================================================
   TYPES
========================================================= */

export type FeeStatus = "PAID" | "PENDING" | "OVERDUE" | "PARTIAL" | "WAIVED";
export type FeeType   = "TUITION" | "ADMISSION" | "EXAM" | "ADHOC" | "SPORTS" | "OTHER";

export interface FeeReportRow {
  ledgerId:         number;
  studentId:        string;
  studentName:      string;
  rollNumber:       string;
  classSectionName: string;
  feeType:          FeeType;
  periodLabel:      string;
  dueDate:          string;
  netDue:           number;
  amountPaid:       number;
  balance:          number;
  status:           FeeStatus;
}

export interface FeeReportPage {
  content:          FeeReportRow[];
  totalElements:    number;
  totalPages:       number;
  number:           number;   // current page (0-indexed)
  size:             number;
  first:            boolean;
  last:             boolean;
  numberOfElements: number;
  empty:            boolean;
}

export interface FeeReportSummary {
  totalGrossAmount: number;
  totalDiscount:    number;
  totalNetAmount:   number;
  totalPaidAmount:  number;
  totalBalanceAmount: number;
}

export interface FeeReportResponse {
  data:               FeeReportPage;
  totalGrossAmount:   number;
  totalDiscount:      number;
  totalNetAmount:     number;
  totalPaidAmount:    number;
  totalBalanceAmount: number;
}

export interface FeeReportFilters {
  academicYearId?: number | "";
  classLevelId?:   number | "";
  sectionId?:      number | "";
  status?:         FeeStatus | "";
  feeType?:        FeeType   | "";
  search?:         string;
  page?:           number;
  size?:           number;
}

/* =========================================================
   API FUNCTION
========================================================= */

export async function getFeeReport(
  filters: FeeReportFilters = {}
): Promise<FeeReportResponse> {
  // Build params — omit empty string / undefined values so the
  // backend doesn't receive empty query params.
  const params: Record<string, string | number> = {};

  if (filters.academicYearId) params.academicYearId = filters.academicYearId;
  if (filters.classLevelId)   params.classLevelId   = filters.classLevelId;
  if (filters.sectionId)      params.sectionId      = filters.sectionId;
  if (filters.status)         params.status         = filters.status;
  if (filters.feeType)        params.feeType        = filters.feeType;
  if (filters.search?.trim()) params.search         = filters.search.trim();
  if (filters.page  !== undefined) params.page      = filters.page;
  if (filters.size  !== undefined) params.size      = filters.size;

  const response = await api.get<ApiResponse<FeeReportResponse>>(
    "/api/reports/fees",
    { params }
  );

  return response.data.data;
}