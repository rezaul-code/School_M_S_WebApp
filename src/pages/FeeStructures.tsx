import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Calendar, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { getFilteredFeeStructures } from "@/lib/api/feeStructures";
import { useAcademicYears } from "@/hooks/useActiveAcademicYear";
import { api } from "@/lib/api/client"; // To fetch the dropdown options directly
import type { FeeStructure } from "@/types/api";

import { CreateFeeStructurePanel } from "@/components/dashboard/FeeStructurePanels/CreateFeeStructurePanel";
import { UpdateFeeStructurePanel } from "@/components/dashboard/FeeStructurePanels/UpdateFeeStructurePanel";

import "@/styles/fee-structure.css";

type ViewState = "list" | "create" | "update";

export default function FeeStructuresPage() {
  const [activeView, setActiveView] = useState<ViewState>("list");
  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);

  // 1. Fetch Global Academic Year Context
  const { 
    years: academicYears, 
    selectedYearId: academicYearId, 
    setSelectedYearId: setAcademicYearId, 
    isLoading: yearsLoading 
  } = useAcademicYears();

  // ─── START OF FIX: WIRE UP LIVE DATABASE OPTIONS ──────────────────────────
  
  // Fetch Classes
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["options", "class-levels"],
    queryFn: async () => {
      const res = await api.get("/api/options/class-levels");
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch Fee Types
  const { data: feeTypes = [], isLoading: feeTypesLoading } = useQuery({
    queryKey: ["options", "fee-types"],
    queryFn: async () => {
      const res = await api.get("/api/options/fee-types");
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch Frequencies
  const { data: frequencies = [], isLoading: frequenciesLoading } = useQuery({
    queryKey: ["options", "fee-frequencies"],
    queryFn: async () => {
      const res = await api.get("/api/options/fee-frequencies");
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // ─── END OF FIX ───────────────────────────────────────────────────────────

  const [classLevelId, setClassLevelId] = useState<number | "">("");
  const [feeType, setFeeType] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");

  const [data, setData] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (activeView !== "list" || academicYearId === "") return;

    setLoading(true);
    try {
      const result = await getFilteredFeeStructures({
        academicYearId: Number(academicYearId),
        ...(classLevelId !== "" && { classLevelId: Number(classLevelId) }),
        ...(feeType !== "" && { feeType }),
        ...(frequency !== "" && { frequency }),
      });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch fee structures", error);
    } finally {
      setLoading(false);
    }
  }, [academicYearId, classLevelId, feeType, frequency, activeView]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (id: number) => {
    setSelectedFeeId(id);
    setActiveView("update");
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this fee structure?")) {
      console.log("Delete trigger for ID:", id);
    }
  };

  const resetFilters = () => {
    setClassLevelId("");
    setFeeType("");
    setFrequency("");
  };

  const handleSuccess = () => {
    setActiveView("list");
    loadData();
  };

  if (activeView === "create") {
    return (
      <div className="fs-page p-6">
        <button 
          onClick={() => setActiveView("list")} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to List
        </button>
        <CreateFeeStructurePanel onSuccess={handleSuccess} /> 
      </div>
    );
  }

  if (activeView === "update") {
    return (
      <div className="fs-page p-6">
        <button 
          onClick={() => setActiveView("list")} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to List
        </button>
        <UpdateFeeStructurePanel 
          feeStructureId={selectedFeeId} 
          onSuccess={handleSuccess} 
        />
      </div>
    );
  }

  return (
    <div className="fs-page p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Structures</h1>
          <p className="text-sm text-slate-500 mt-1">Manage fee categories and schedules</p>
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm p-1">
          <div className="pl-3 pr-2 text-slate-400">
            <Calendar size={18} />
          </div>
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(Number(e.target.value))}
            disabled={yearsLoading}
            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer py-2 pr-8 pl-1 outline-none appearance-none min-w-[140px] disabled:opacity-50"
          >
            {yearsLoading ? (
              <option value="">Loading...</option>
            ) : (
              academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.active ? "(Active)" : ""}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

            {/* DYNAMIC CLASS DROPDOWN */}
            <select 
              className="border border-slate-200 rounded-md text-sm p-2 bg-white min-w-[150px] shadow-sm disabled:opacity-50"
              value={classLevelId}
              onChange={(e) => setClassLevelId(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={classesLoading}
            >
              <option value="">{classesLoading ? "Loading..." : "All Classes"}</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.label || cls.displayName || cls.name}
                </option>
              ))}
            </select>

            {/* DYNAMIC FEE TYPE DROPDOWN */}
            <select 
              className="border border-slate-200 rounded-md text-sm p-2 bg-white min-w-[150px] shadow-sm disabled:opacity-50"
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              disabled={feeTypesLoading}
            >
              <option value="">{feeTypesLoading ? "Loading..." : "All Fee Types"}</option>
              {feeTypes.map((type: string) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            {/* DYNAMIC FREQUENCY DROPDOWN */}
            <select 
              className="border border-slate-200 rounded-md text-sm p-2 bg-white min-w-[150px] shadow-sm disabled:opacity-50"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              disabled={frequenciesLoading}
            >
              <option value="">{frequenciesLoading ? "Loading..." : "All Frequencies"}</option>
              {frequencies.map((freq: string) => (
                <option key={freq} value={freq}>
                  {freq.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            {(classLevelId !== "" || feeType !== "" || frequency !== "") && (
              <button onClick={resetFilters} className="text-sm text-slate-500 hover:text-slate-800 ml-2">
                Clear Filters
              </button>
            )}
          </div>

          <button 
            onClick={() => setActiveView("create")}
            className="w-full lg:w-auto bg-[#4C4EE4] hover:bg-[#3d3fcf] text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} /> Create New
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <th className="py-3 px-6">ID</th>
                <th className="py-3 px-6">Class</th>
                <th className="py-3 px-6">Fee Type</th>
                <th className="py-3 px-6">Frequency</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#4C4EE4] border-t-transparent rounded-full animate-spin"></div>
                      Loading structures...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No fee structures found for the selected criteria.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-6 text-slate-500">{row.id}</td>
                    <td className="py-3 px-6 font-medium text-slate-800">
                      {row.className.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        {row.feeType}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {row.frequency.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-6 font-semibold text-slate-900">
                      ₹{Number(row.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button 
                        onClick={() => handleEdit(row.id)}
                        className="p-1.5 text-slate-400 hover:text-[#4C4EE4] hover:bg-blue-50 rounded transition-colors mr-2"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}