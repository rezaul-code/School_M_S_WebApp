import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import {
  GraduationCap,
  MoreHorizontal,
  Search,
} from "lucide-react";

import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { listStudents } from "@/lib/api/students";

import type { Student } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Pagination from "@/components/common/Pagination";
import StudentDetailDrawer from "@/components/students/StudentDetailDrawer";
import FeeSummaryDrawer from "@/components/students/FeeSummaryDrawer";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import "@/styles/student-pages.css";

export default function Students() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [feeSummaryStudentId, setFeeSummaryStudentId] =
    useState<string | null>(null);

  const [openFeeSummary, setOpenFeeSummary] =
    useState(false);

  // ✅ Active Academic Year Logic Preserved
  const { data: activeYear, isLoading: yearLoading } =
    useActiveAcademicYear();

  const studentsQuery = useQuery({
    queryKey: [
      "students",
      page,
      search,
      selectedClass,
      selectedSection,
      selectedStatus,
    ],
    queryFn: () =>
      listStudents({
        page,
        size: 10,
        search: search || undefined,
        classSectionId: selectedSection || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const students = studentsQuery.data?.content ?? [];
  const totalElements = studentsQuery.data?.totalElements ?? 0;

  // ✅ Filtering Memo Logic Preserved
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = !selectedClass;
      const matchesSection =
        !selectedSection ||
        (s.classSectionId ?? "").toString() === selectedSection;

      const matchesStatus =
        !selectedStatus ||
        (s.admissionDate ? "admitted" : "pending") === selectedStatus;

      return matchesClass && matchesSection && matchesStatus;
    });
  }, [students, selectedClass, selectedSection, selectedStatus]);

  const totalPages = Math.ceil(totalElements / 10);

  // ✅ UI Block for Year Loading Preserved
  if (yearLoading || !activeYear) {
    return <div className="p-4">Loading academic year...</div>;
  }

  return (
    <div className="sl-page">
      {/* ── DARK HEADER BANNER (Fixes the White Header Issue) ── */}
      <div className="sl-header">
        <div className="sl-header-left">
          <div className="sl-header-icon">
            <GraduationCap />
          </div>
          <div>
            <h1 className="sl-header-title">Student Directory</h1>
            <p className="sl-header-sub">
              Manage student admissions, details and academic records.
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="sl-card bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Toolbar / Search Logic Preserved */}
        <div className="border-b border-slate-100 p-4">
          <div className="sl-toolbar">
            <div className="sl-search-wrap relative max-w-sm">
              <Search className="sl-search-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search students..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
        </div>

        {/* Table Area Logic Preserved */}
        <div className="sl-table-wrap">
          <Table className="sl-table">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roll #</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Admitted</TableHead>
                <TableHead className="w-[60px] pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {studentsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium pl-6">
                      <div className="sl-student-cell">
                        <span className="sl-student-name">{student.fullName}</span>
                        {student.phone && (
                          <p className="text-[10px] text-muted-foreground">
                            {student.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{student.email}</TableCell>

                    <TableCell>
                      <span className="sl-roll">{student.rollNumber || "—"}</span>
                    </TableCell>

                    <TableCell>
                      <span className={student.classSectionName ? "sl-section-badge" : "sl-section-badge sl-section-badge--unassigned"}>
                        {student.classSectionName ?? "Unassigned"}
                      </span>
                    </TableCell>

                    <TableCell>
                      {student.admissionDate
                        ? format(
                            new Date(student.admissionDate),
                            "MMM dd, yyyy"
                          )
                        : "—"}
                    </TableCell>

                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Student actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              setSelectedStudent(student)
                            }
                          >
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            disabled={!activeYear?.id}
                            onSelect={() => {
                              setFeeSummaryStudentId(student.id);
                              setOpenFeeSummary(true);
                            }}
                          >
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

        {/* Footer / Pagination Logic Preserved */}
        {(totalPages > 1 || totalElements > 0) && (
          <div className="sl-footer">
            <div className="text-sm text-muted-foreground">
              Total Students: {totalElements}
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

      {/* ✅ All Drawers Preserved */}
      <StudentDetailDrawer
        studentId={selectedStudent?.id ?? ""}
        open={!!selectedStudent}
        onOpenChange={() => setSelectedStudent(null)}
      />

      <FeeSummaryDrawer
        studentId={feeSummaryStudentId}
        open={openFeeSummary}
        onOpenChange={(v) => {
          setOpenFeeSummary(v);
          if (!v) setFeeSummaryStudentId(null);
        }}
        academicYearId={activeYear.id}
      />
    </div>
  );
}