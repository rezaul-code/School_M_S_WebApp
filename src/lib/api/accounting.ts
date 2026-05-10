// src/lib/api/accounting.ts

import { api } from "./client";

// =====================================================================
// TYPES
// =====================================================================

export type PaymentMode =
  | "CASH"
  | "UPI"
  | "CARD"
  | "BANK_TRANSFER"
  | "CHEQUE";

export type TimeFrame = "TODAY" | "CURRENT_MONTH" | "DATE_RANGE";

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
  paidAt: string;
  collectedBy: string | null;
}

/**
 * Query parameters sent to GET /api/accounting/collections
 *
 * TODAY        → timeFrame=TODAY
 * CURRENT_MONTH→ timeFrame=CURRENT_MONTH  [+ academicYearId?]  [+ paymentMode?]
 * DATE_RANGE   → timeFrame=DATE_RANGE  + startDate  + endDate  [+ paymentMode?]
 *
 * NOTE: NO `month` param — CURRENT_MONTH always means the server's current month.
 */
export interface CollectionParams {
  timeFrame:      TimeFrame;
  academicYearId?: number;          // CURRENT_MONTH only
  startDate?:      string;          // DATE_RANGE only  "YYYY-MM-DD"
  endDate?:        string;          // DATE_RANGE only  "YYYY-MM-DD"
  paymentMode?:    PaymentMode;     // CURRENT_MONTH + DATE_RANGE
  page:            number;
  size:            number;
}

/**
 * What getFeeCollections() resolves to.
 */
export interface FeeCollectionResult {
  rows:              FeeCollection[];
  totalElements:     number;
  totalPages:        number;
  currentPage:       number;
  pageSize:          number;
  // KPI totals
  totalCollected:    number;
  totalCash:         number;
  totalUpi:          number;
  totalCard:         number;
  totalBankTransfer: number;
}

// =====================================================================
// PARAM BUILDER
// Only sends params that are defined and non-empty.
// Spring Boot will return 400/500 for unexpected / empty params.
// =====================================================================

function buildParams(p: CollectionParams): Record<string, string | number> {
  const out: Record<string, string | number> = {
    timeFrame: p.timeFrame,
    page:      p.page,
    size:      p.size,
  };

  if (p.timeFrame === "CURRENT_MONTH") {
    // academicYearId — only when a real positive number
    if (p.academicYearId != null && p.academicYearId > 0)
      out.academicYearId = p.academicYearId;
    // paymentMode — only when a specific mode is selected (not ALL)
    if (p.paymentMode)
      out.paymentMode = p.paymentMode;
  }

  if (p.timeFrame === "DATE_RANGE") {
    if (p.startDate) out.startDate = p.startDate;
    if (p.endDate)   out.endDate   = p.endDate;
    if (p.paymentMode) out.paymentMode = p.paymentMode;
  }

  // TODAY sends nothing extra
  return out;
}

// =====================================================================
// RESPONSE SHAPE (internal — not exported)
//
// The CONFIRMED backend JSON structure is:
//
//   {                                        ← HTTP response body
//     "success": true,
//     "message": "...",
//     "errorCode": null,
//     "data": {                              ← response.data.data  (Axios strips one .data)
//       "totalCollected": 2000.00,           ← KPI totals live HERE
//       "totalCash": 0,
//       "totalUpi": 2000.00,
//       "totalCard": 0,
//       "totalBankTransfer": 0,
//       "data": {                            ← response.data.data.data  (the Page)
//         "content": [...],                  ← response.data.data.data.content
//         "totalElements": 5,
//         "totalPages": 1,
//         "number": 0,
//         "size": 10
//       }
//     }
//   }
//
// Axios response.data == the JSON body above.
// So:
//   response.data.success         → true/false
//   response.data.data            → the payload object (has totals + nested Page)
//   response.data.data.totalCollected  → KPI total
//   response.data.data.data            → Page<FeeCollection>
//   response.data.data.data.content    → FeeCollection[]
// =====================================================================

interface ApiOuter {
  success:    boolean;
  message:    string | null;
  errorCode:  string | null;
  data:       ApiInnerPayload;
}

interface ApiInnerPayload {
  totalCollected:    number;
  totalCash:         number;
  totalUpi:          number;
  totalCard:         number;
  totalBankTransfer: number;
  data:              PageShape;
}

interface PageShape {
  content:       FeeCollection[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
  first?:        boolean;
  last?:         boolean;
}

// =====================================================================
// API FUNCTION
// =====================================================================

export async function getFeeCollections(
  params: CollectionParams,
): Promise<FeeCollectionResult> {
  const queryParams = buildParams(params);

  console.log("[accounting] getFeeCollections → request params:", queryParams);

  try {
    const response = await api.get<ApiOuter>(
      "/api/accounting/fee-collections",
      { params: queryParams },
    );

    // ── Full response dump for debugging ──────────────────────────
    console.log("[accounting] getFeeCollections ← HTTP status  :", response.status);
    console.log("[accounting] getFeeCollections ← response.data:", response.data);

    const outer = response.data; // ApiOuter

    if (!outer?.success) {
      console.warn("[accounting] success=false →", outer);
    }

    // response.data.data  → ApiInnerPayload (has totals + nested Page)
    const payload = outer?.data as ApiInnerPayload | undefined;
    console.log("[accounting] getFeeCollections ← payload (data.data):", payload);

    // response.data.data.data → Page<FeeCollection>
    const page = payload?.data as PageShape | undefined;
    console.log("[accounting] getFeeCollections ← page (data.data.data):", page);
    console.log("[accounting] getFeeCollections ← content:", page?.content);

    const rows: FeeCollection[] = Array.isArray(page?.content) ? page!.content : [];

    const result: FeeCollectionResult = {
      rows,
      totalElements:     page?.totalElements ?? 0,
      totalPages:        page?.totalPages    ?? 0,
      currentPage:       page?.number        ?? 0,
      pageSize:          page?.size          ?? params.size,
      // KPI totals — from payload (response.data.data), NOT from outer
      totalCollected:    typeof payload?.totalCollected    === "number" ? payload.totalCollected    : 0,
      totalCash:         typeof payload?.totalCash         === "number" ? payload.totalCash         : 0,
      totalUpi:          typeof payload?.totalUpi          === "number" ? payload.totalUpi          : 0,
      totalCard:         typeof payload?.totalCard         === "number" ? payload.totalCard         : 0,
      totalBankTransfer: typeof payload?.totalBankTransfer === "number" ? payload.totalBankTransfer : 0,
    };

    console.log("[accounting] getFeeCollections ← resolved result:", result);
    return result;

  } catch (error: unknown) {
    const e = error as {
      response?: {
        status:  number;
        data:    unknown;
        config?: { url?: string; params?: unknown };
      };
      message?: string;
    };

    console.error("━━━ [accounting] getFeeCollections FAILED ━━━");
    console.error("  URL    :", e?.response?.config?.url ?? "/api/accounting/collections");
    console.error("  Params :", e?.response?.config?.params ?? queryParams);
    console.error("  Status :", e?.response?.status);
    console.error("  Body   :", JSON.stringify(e?.response?.data, null, 2));
    console.error("  Message:", e?.message);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    throw error;
  }
}