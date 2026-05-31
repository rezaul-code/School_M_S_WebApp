// src/hooks/useAcademicYears.ts
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAcademicYears, getActiveAcademicYear } from "@/lib/api/master";
import type { AcademicYear } from "@/types/api";

// ── 1. Simple Hook: Just fetches the active year (Used in PayFee) ──
export function useActiveAcademicYear() {
  return useQuery({
    queryKey: ["active-academic-year"],
    queryFn: getActiveAcademicYear,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    refetchOnMount: true,
  });
}

// ── 2. Advanced Hook: Fetches list, sorts active first, handles dropdown state (Used in FeeStructures) ──
export function useAcademicYears() {
  const [selectedYearId, setSelectedYearId] = useState<number | string | "">("");

  const query = useQuery({
    queryKey: ["academic-years-list"],
    queryFn: listAcademicYears,
    staleTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnMount: true,
    select: (data: AcademicYear[]): AcademicYear[] => {
      if (!data || data.length === 0) return [];
      
      const activeYear = data.find((year) => year.active);
      const inactiveYears = data.filter((year) => !year.active);

      return activeYear ? [activeYear, ...inactiveYears] : data;
    },
  });

  useEffect(() => {
    if (query.data && query.data.length > 0 && selectedYearId === "") {
      setSelectedYearId(query.data[0].id);
    }
  }, [query.data, selectedYearId]);

  return {
    years: query.data || [],
    selectedYearId,
    setSelectedYearId,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}