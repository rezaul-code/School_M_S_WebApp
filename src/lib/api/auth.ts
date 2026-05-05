import { api, TOKEN_KEY } from "./client";
import type { AuthLoginResponse } from "@/types/api";

interface LoginApiResponse {
  data: AuthLoginResponse & { email?: string; role?: string; expiresIn?: number };
  message: string;
  success: boolean;
  errorCode: null | string;
}

export async function login(email: string, password: string): Promise<string> {
  const response = await api.post<LoginApiResponse>("/api/auth/login", { email, password });
  const { data } = response.data;
  const token = data.token || data.accessToken || data.jwt;
  if (!token) throw new Error("No token returned from server");
  localStorage.setItem(TOKEN_KEY, token);
  if (data.user) {
    localStorage.setItem("SCHOOL_USER", JSON.stringify(data.user));
  }
  return token;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("SCHOOL_USER");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): { id: string; email: string; firstName?: string; lastName?: string } | null {
  const raw = localStorage.getItem("SCHOOL_USER");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
