import { api } from "./client";

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

export interface DropdownOption {
  id: string | number;
  value: string;
  label: string;
}

/**
 * Fetch dropdown options from API
 * Returns empty array on error instead of throwing
 * Handles various response formats
 */
export async function getDropdownOptions(
  optionType: "fee-types" | "fee-frequencies" | string
): Promise<DropdownOption[]> {
  try {
    const response = await api.get<ApiResponse<DropdownOption[]>>(
      `/api/master/options/${optionType}`
    );
    
    // Handle various response formats
    const data = response?.data?.data;
    
    if (!data) {
      console.warn(`No data returned for ${optionType}`);
      return [];
    }
    
    if (!Array.isArray(data)) {
      console.warn(`Expected array for ${optionType}, got:`, typeof data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${optionType}:`, error);
    return [];
  }
}