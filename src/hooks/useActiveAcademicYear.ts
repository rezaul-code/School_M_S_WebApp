import { useQuery } from "@tanstack/react-query";
import { getActiveAcademicYear } from "@/lib/api/master";
 
export function useActiveAcademicYear() {
  return useQuery({
    queryKey: ["active-academic-year"],
    queryFn: getActiveAcademicYear,
 
    // ✅ Keep data stable for UI like fee drawer
    staleTime: 1000 * 60 * 10, // 10 minutes
 
    // ✅ Prevent silent failure loops
    retry: 1,
 
    // ✅ Ensure always fresh on first load (important)
    refetchOnMount: true,
  });
}