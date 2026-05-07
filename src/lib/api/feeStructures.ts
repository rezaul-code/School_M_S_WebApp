import { api } from "./client";

import type {
  FeePreview,
  FeeStructure,
} from "@/types/api";

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

export async function createFeeStructure(payload: {
  classLevelId: number;
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
  classLevelId?: number;
  academicYearId?: number;
  feeType?: string;
  frequency?: string;
}) {
  const response = await api.get<ApiResponse<FeeStructure[]>>(
    "/api/master/fee-structures",
    {
      params: {
        classLevelId: params.classLevelId,
        academicYearId: params.academicYearId,
        feeType: params.feeType,
        frequency: params.frequency,
      },
    }
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
  const response = await api.patch<ApiResponse<FeeStructure>>(
    `/api/master/fee-structures/${id}`,
    payload
  );
  return response.data.data;
}

export async function getFeePreview(params: {
  classSectionId: string;
  academicYearId: string;
}) {
  const response = await api.get<ApiResponse<FeePreview>>(
    "/api/master/fee-structures/preview",
    {
      params,
    }
  );
  return response.data.data;
}