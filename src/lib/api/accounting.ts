// src/lib/api/accounting.ts

import { api } from "./client";
import type { ApiResponse, Page } from "@/types/api";

// ======================================================
// TYPES
// ======================================================

export type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
export type CollectionStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

export interface FeeCollection {
  id: number;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classSectionName: string;
  feeType: string;
  academicYearId: number;
  academicYearName: string;
  amountPaid: number;
  paymentMode: PaymentMode;
  transactionReference: string | null;
  remarks: string | null;
  status: CollectionStatus;
  paidAt: string; // ISO date-time
  collectedBy: string | null;
}

/**
 * All optional filter fields use `number | undefined` (never `number | ""`).
 * The UI state layer converts empty-select values to undefined before
 * calling the API, so Spring Boot never receives an invalid param.
 */
export interface FeeCollectionFilters {
  academicYearId?: number;
  classLevelId?:   number;
  sectionId?:      number;
  paymentMode?:    PaymentMode;
  feeType?:        string;
  search?:         string;
  fromDate?:       string;
  toDate?:         string;
  page:            number;
  size:            number;
}

/**
 * What getFeeCollections() resolves to.
 * `page` is the raw Spring Page<T>; the aggregate fields are either
 * returned by the backend or derived client-side from the page content.
 */
export interface FeeCollectionPageResult {
  page:               Page<FeeCollection>;
  totalCollected:     number;
  totalTransactions:  number;
  cashTotal:          number;
  upiTotal:           number;
  cardTotal:          number;
  bankTransferTotal:  number;
}

// ======================================================
// PARAM BUILDER
// Strips undefined / empty values so the backend never
// receives invalid query parameters.
// ======================================================

function buildParams(
  filters: FeeCollectionFilters,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: filters.page,
    size: filters.size,
  };

  // Numeric IDs — only include when a real value is present
  if (filters.academicYearId != null && filters.academicYearId > 0)
    params.academicYearId = filters.academicYearId;
  if (filters.classLevelId != null && filters.classLevelId > 0)
    params.classLevelId = filters.classLevelId;
  if (filters.sectionId != null && filters.sectionId > 0)
    params.sectionId = filters.sectionId;

  // String / enum fields — only include non-empty strings
  if (filters.paymentMode)        params.paymentMode = filters.paymentMode;
  if (filters.feeType)            params.feeType     = filters.feeType;
  if (filters.search?.trim())     params.search      = filters.search.trim();
  if (filters.fromDate)           params.fromDate    = filters.fromDate;
  if (filters.toDate)             params.toDate      = filters.toDate;

  return params;
}

// ======================================================
// API FUNCTION
// ======================================================

/**
 * GET /api/accounting/fee-collections
 *
 * Backend contract (mirrors every other endpoint in this project):
 *   response body → ApiResponse<Page<FeeCollection>>
 *
 * Some backends also embed aggregate totals as extra fields on the
 * `data` object alongside the Page fields. Both shapes are handled.
 */
export async function getFeeCollections(
  filters: FeeCollectionFilters,
): Promise<FeeCollectionPageResult> {
  const params = buildParams(filters);

  console.debug("[accounting] getFeeCollections → params:", params);

  try {
    const response = await api.get<
      ApiResponse<
        Page<FeeCollection> & {
          // Optional aggregates the backend MAY co-locate on the Page object
          totalCollected?:    number;
          totalTransactions?: number;
          cashTotal?:         number;
          upiTotal?:          number;
          cardTotal?:         number;
          bankTransferTotal?: number;
        }
      >
    >("/api/accounting/fee-collections", { params });

    console.debug(
      "[accounting] getFeeCollections ← status:", response.status,
      "| success:", response.data?.success,
    );
    console.debug("[accounting] getFeeCollections ← raw data:", response.data?.data);

    const outer = response.data;

    if (!outer?.success) {
      console.warn(
        "[accounting] getFeeCollections: backend returned success=false →",
        outer,
      );
    }

    const raw = outer?.data;

    // ── Normalise page fields (defensive guards on every field) ──
    const page: Page<FeeCollection> = {
      content:       Array.isArray(raw?.content) ? raw.content : [],
      totalElements: raw?.totalElements ?? 0,
      totalPages:    raw?.totalPages    ?? 0,
      number:        raw?.number        ?? 0,
      size:          raw?.size          ?? filters.size,
      first:         raw?.first,
      last:          raw?.last,
    };

    const content = page.content;

    // ── Aggregate totals: prefer backend value, fall back to page sum ──
    const totalCollected =
      typeof raw?.totalCollected === "number"
        ? raw.totalCollected
        : content.reduce((s, r) => s + (r.amountPaid ?? 0), 0);

    const totalTransactions =
      typeof raw?.totalTransactions === "number"
        ? raw.totalTransactions
        : page.totalElements;

    const cashTotal =
      typeof raw?.cashTotal === "number"
        ? raw.cashTotal
        : content
            .filter((r) => r.paymentMode === "CASH")
            .reduce((s, r) => s + (r.amountPaid ?? 0), 0);

    const upiTotal =
      typeof raw?.upiTotal === "number"
        ? raw.upiTotal
        : content
            .filter((r) => r.paymentMode === "UPI")
            .reduce((s, r) => s + (r.amountPaid ?? 0), 0);

    const cardTotal =
      typeof raw?.cardTotal === "number"
        ? raw.cardTotal
        : content
            .filter((r) => r.paymentMode === "CARD")
            .reduce((s, r) => s + (r.amountPaid ?? 0), 0);

    const bankTransferTotal =
      typeof raw?.bankTransferTotal === "number"
        ? raw.bankTransferTotal
        : content
            .filter((r) => r.paymentMode === "BANK_TRANSFER")
            .reduce((s, r) => s + (r.amountPaid ?? 0), 0);

    return {
      page,
      totalCollected,
      totalTransactions,
      cashTotal,
      upiTotal,
      cardTotal,
      bankTransferTotal,
    };
  } catch (error: unknown) {
    // Full diagnostic dump — visible in browser DevTools console
    const axiosErr = error as {
      response?: {
        status:  number;
        data:    unknown;
        config?: { url?: string; params?: unknown };
      };
      message?: string;
    };

    console.error("━━━━━ [accounting] getFeeCollections FAILED ━━━━━");
    console.error(
      "  URL   :",
      axiosErr?.response?.config?.url ?? "/api/accounting/fee-collections",
    );
    console.error("  Params:", axiosErr?.response?.config?.params ?? params);
    console.error("  Status:", axiosErr?.response?.status);
    console.error("  Body  :", axiosErr?.response?.data);
    console.error("  Msg   :", axiosErr?.message);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    throw error; // Let React Query set isError = true
  }
}