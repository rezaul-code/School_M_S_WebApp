import { api } from "./client";

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

interface DropdownOption {
  id: string | number;
  value: string;
  label: string;
}

/**
 * Fetch dropdown options from API
 * Supports: fee-types, fee-frequencies, etc.
 */
export async function getDropdownOptions(
  optionType: "fee-types" | "fee-frequencies" | string
): Promise<DropdownOption[]> {
  const response = await api.get<ApiResponse<DropdownOption[]>>(
    `/api/master/options/${optionType}`
  );
  return response.data.data;
}