import { api, TOKEN_KEY } from "./client";
import type { FeeStructure } from "@/types/api";

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

export async function createFeeStructure(payload: {
  className: string;
  academicYearId: number;
  feeType: string;
  frequency: string;
  amount: number;
  description?: string;
}) {
  const response = await api.post<ApiResponse<FeeStructure>>(
    "/api/master/fee-structures",
    payload
  );
  return response.data.data;
}

export async function getAllFeeStructures() {
  const response = await api.get<ApiResponse<FeeStructure[]>>(
    "/api/master/fee-structures"
  );
  return response.data.data;
}

export async function getFilteredFeeStructures(params: {
  className?: string;
  academicYearId?: number;
}) {
  const response = await api.get<ApiResponse<FeeStructure[]>>(
    "/api/master/fee-structures",
    { params }
  );
  return response.data.data;
}

export async function updateFeeStructure(
  id: number,
  payload: {
    amount?: number;
    description?: string;
  }
) {
  // Guard: Validate ID
  if (!id || isNaN(id) || id <= 0) {
    throw new Error("Please provide a valid Fee Structure ID");
  }

  // Guard: Validate token exists
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error("Authentication token missing. Please log in again.");
  }

  const response = await api.patch<ApiResponse<FeeStructure>>(
    `/api/master/fee-structures/${id}`,
    payload
  );
  return response.data.data;
}
