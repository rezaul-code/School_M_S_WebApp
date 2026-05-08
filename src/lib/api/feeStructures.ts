import { api } from "./client";
import type { FeePreview, FeeStructure } from "@/types/api";

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
}): Promise<FeeStructure | null> {
  try {
    const response = await api.post<ApiResponse<FeeStructure>>(
      "/api/master/fee-structures",
      payload
    );
    return response?.data?.data || null;
  } catch (error) {
    console.error("Create fee structure error:", error);
    throw error;
  }
}

export async function getAllFeeStructures(): Promise<FeeStructure[]> {
  try {
    const response = await api.get<ApiResponse<FeeStructure[]>>("/api/master/fee-structures");
    const data = response?.data?.data;

    if (!data) {
      console.warn("No data returned from getAllFeeStructures");
      return [];
    }

    if (!Array.isArray(data)) {
      console.warn("getAllFeeStructures returned non-array:", typeof data);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Get all fee structures error:", error);
    return [];
  }
}

export async function getFilteredFeeStructures(params: {
  classLevelId?: number;
  academicYearId?: number;
  feeType?: string;
  frequency?: string;
}): Promise<FeeStructure[]> {
  try {
    // Build query params safely
    const queryParams: Record<string, any> = {};

    if (params.classLevelId !== undefined && params.classLevelId !== null) {
      queryParams.classLevelId = params.classLevelId;
    }
    if (params.academicYearId !== undefined && params.academicYearId !== null) {
      queryParams.academicYearId = params.academicYearId;
    }
    if (params.feeType && params.feeType.trim()) {
      queryParams.feeType = params.feeType;
    }
    if (params.frequency && params.frequency.trim()) {
      queryParams.frequency = params.frequency;
    }

    const response = await api.get<ApiResponse<FeeStructure[]>>("/api/master/fee-structures", {
      params: queryParams,
    });

    const data = response?.data?.data;

    if (!data) {
      console.warn("No data returned from getFilteredFeeStructures");
      return [];
    }

    if (!Array.isArray(data)) {
      console.warn("getFilteredFeeStructures returned non-array:", typeof data);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Get filtered fee structures error:", error);
    return [];
  }
}

export async function updateFeeStructure(
  id: number,
  payload: {
    amount?: number;
    description?: string;
  }
): Promise<FeeStructure | null> {
  try {
    const response = await api.patch<ApiResponse<FeeStructure>>(
      `/api/master/fee-structures/${id}`,
      payload
    );
    return response?.data?.data || null;
  } catch (error) {
    console.error("Update fee structure error:", error);
    throw error;
  }
}

export async function getFeeStructuresByClass(
  classLevelId: number,
  academicYearId: number
): Promise<FeeStructure[]> {
  return getFilteredFeeStructures({
    classLevelId,
    academicYearId,
  });
}

export async function getFeePreview(params: {
  classSectionId: string;
  academicYearId: string;
}): Promise<FeePreview | null> {
  try {
    const response = await api.get<ApiResponse<FeePreview>>(
      "/api/master/fee-structures/preview",
      {
        params,
      }
    );
    return response?.data?.data || null;
  } catch (error) {
    console.error("Get fee preview error:", error);
    return null;
  }
}