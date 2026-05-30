import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

import {
  MoreHorizontal,
  Search,
} from "lucide-react";

import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { listStudents, getFormOptions } from "@/lib/api/students";
import type { AcademicYear, ClassLevel, ClassSection } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Pagination from "@/components/common/Pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import "@/styles/student-pages.css";

// ✅ Form Option Typings
interface FormOptions {
  academicYears: AcademicYear[];
  classLevels: ClassLevel[];
  classSections: ClassSection[];
}

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Alumni", value: "ALUMNI" },
  { label: "Transferred", value: "TRANSFERRED" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function Students() {
  const navigate = useNavigate();

  // ── FILTER STATE ──
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(""); // "" = All Statuses

  // Always bind queries to the active academic year
  const { data: activeYear, isLoading: yearLoading } = useActiveAcademicYear();

  // ── MASTER DATA QUERY ──
  const formOptionsQuery = useQuery<FormOptions>({
    queryKey: ['form-options'],
    queryFn: () => getFormOptions() as unknown as Promise<FormOptions>,
  });

  const classLevels = formOptionsQuery.data?.classLevels ?? [];
  const classSections = formOptionsQuery.data?.classSections ?? [];

  // Cascade sections dynamically based on the selected class
  const availableSections = classSections.filter(
    (s) => !selectedClass || String(s.classLevelId) === selectedClass
  );

  // ── SERVER-SIDE FILTERING QUERY ──
const studentsQuery = useQuery({
    queryKey: ["students", page, search, selectedClass, selectedSection, selectedStatus, activeYear?.id],
    queryFn: () =>
      listStudents({
        page,
        size: 10,
        search: search || undefined,
        academicYearId: activeYear?.id || undefined,
        classLevelId: selectedClass || undefined,
        classSectionId: selectedSection || undefined, // <-- FIXED: Passed as classSectionId
        status: selectedStatus || undefined,
      }),
    enabled: !!activeYear?.id,
    placeholderData: (prev) => prev,
  });

  const students = studentsQuery.data?.content ?? [];
  const totalElements = studentsQuery.data?.totalElements ?? 0;
  const totalPages = Math.ceil(totalElements / 10);

  // Helper for consistent dropdown styling
  const dropdownClass = "h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 appearance-none cursor-pointer";

  if (yearLoading) {
    return <div className="p-4 text-slate-500 font-medium">Loading academic year...</div>;
  }

  return (
    <div className="sl-page space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="sl-card bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* ── TOOLBAR & FILTERS ── */}
        <div className="border-b border-slate-100 p-4 bg-slate-50/50">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            
            {/* Search */}
            <div className="sl-search-wrap relative w-full lg:max-w-sm">
              <Search className="sl-search-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search students..."
                className="pl-10 bg-white border-slate-300"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              
              <select
                className={dropdownClass}
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <select
                className={dropdownClass}
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection(""); // Reset section when class changes
                  setPage(0);
                }}
              >
                <option value="">All Classes</option>
                {classLevels.map((c) => (
                  <option key={c.id} value={c.id}>{c.displayName || c.name}</option>
                ))}
              </select>

              <select
                className={dropdownClass}
                value={selectedSection}
                disabled={!selectedClass || availableSections.length === 0}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">
                  {!selectedClass ? "Select Class First" : availableSections.length === 0 ? "No Sections" : "All Sections"}
                </option>
                {availableSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.sectionName}</option>
                ))}
              </select>
              
            </div>
          </div>
        </div>

        {/* ── TABLE AREA ── */}
        <div className="sl-table-wrap">
          <Table className="sl-table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 font-bold text-slate-600">Student</TableHead>
                <TableHead className="font-bold text-slate-600">Email</TableHead>
                <TableHead className="font-bold text-slate-600">Roll #</TableHead>
                <TableHead className="font-bold text-slate-600">Section</TableHead>
                <TableHead className="font-bold text-slate-600">Status</TableHead>
                <TableHead className="font-bold text-slate-600">Admitted</TableHead>
                <TableHead className="w-[60px] pr-6 font-bold text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {studentsQuery.isLoading || formOptionsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-violet-600 rounded-full animate-spin"></div>
                      Loading students...
                    </div>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500 font-medium">
                    No students found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student: any) => (
                  <TableRow key={student.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium pl-6">
                      <div className="sl-student-cell">
                        <span className="sl-student-name font-bold text-slate-900">{student.fullName}</span>
                        {student.phone && (
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                            {student.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-600 font-medium">{student.email}</TableCell>

                    <TableCell>
                      <span className="sl-roll text-slate-700 font-semibold">{student.rollNumber || "—"}</span>
                    </TableCell>

                    <TableCell>
                      <span className={student.classSectionName ? "sl-section-badge text-xs font-bold px-2 py-1 bg-violet-50 text-violet-700 rounded-md border border-violet-100" : "sl-section-badge sl-section-badge--unassigned text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200"}>
                        {student.classSectionName ?? "Unassigned"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-sm tracking-wide ${
                        student.active || student.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {student.status || (student.active ? 'ACTIVE' : 'INACTIVE')}
                      </span>
                    </TableCell>

                    <TableCell className="text-slate-600 font-medium">
                      {student.admissionDate
                        ? format(new Date(student.admissionDate), "MMM dd, yyyy")
                        : "—"}
                    </TableCell>

                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-400 hover:text-slate-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40 font-medium text-slate-700">
                          <DropdownMenuItem className="cursor-pointer focus:bg-slate-50 focus:text-violet-700" onSelect={() => navigate(`/students/${student.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer focus:bg-slate-50 focus:text-violet-700" disabled={!activeYear?.id} onSelect={() => navigate(`/students/${student.id}/fee-summary`)}>
                            Fee Summary
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── FOOTER & PAGINATION ── */}
        {(totalPages > 1 || totalElements > 0) && (
          <div className="sl-footer p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="text-sm font-semibold text-slate-500">
              Total Students: <span className="text-slate-900">{totalElements}</span>
            </div>

            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}