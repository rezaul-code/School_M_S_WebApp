import { api } from "./client";
 
export async function getActiveAcademicYear() {
  const res = await api.get("/master/academic-years/active");
  return res.data.data; // because ApiResponse wrapper
}