// src/pages/TeacherAssignments.tsx

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import EmptyState from "@/components/common/EmptyState";
import LoadingTable from "@/components/common/LoadingTable";
import Pagination from "@/components/common/Pagination";

import { getTeacherAssignments, listTeachers } from "@/lib/api/teachers";
import { useDebounce } from "@/hooks/useDebounce";

import "@/styles/teacher.css";

export default function TeacherAssignmentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({ page, size: 20, search: debouncedSearch || undefined }),
    [page, debouncedSearch]
  );

  const teachersQuery = useQuery({
    queryKey: ["teachers", params],
    queryFn: () => listTeachers(params),
  });

  const teachers = teachersQuery.data?.content || [];

  const assignmentsQuery = useQuery({
    queryKey: ["teacher-assignments-page", teachers.map((t) => t.id)],
    enabled: teachers.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        teachers.map(async (teacher) => {
          const assignments = await getTeacherAssignments(teacher.id);
          return assignments.map((assignment) => ({
            ...assignment,
            teacherName:
              teacher.fullName ||
              `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
          }));
        })
      );
      return results.flat();
    },
  });

  const assignments = assignmentsQuery.data || [];
  const isLoading = teachersQuery.isLoading || assignmentsQuery.isLoading;

  return (
    <div className="tm-page">
      {/* HERO */}
      <div className="tm-hero">
        <div className="tm-hero-glow" />
        <div className="tm-hero-inner">
          <div className="tm-hero-left">
            <div className="tm-hero-icon-wrap">
              <ClipboardList />
            </div>
            <div className="tm-hero-text">
              <h2 className="tm-hero-title">Teacher Assignments</h2>
              <p className="tm-hero-sub">View all subject assignments across teachers</p>
            </div>
          </div>
          <span className="tm-hero-badge">{assignments.length} Assignments</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="tm-toolbar">
        <div className="tm-search-wrap">
          <Search className="search-icon" />
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search teacher..."
          />
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="tm-card">
        {isLoading ? (
          <div className="tm-card-body">
            <LoadingTable cols={5} />
          </div>
        ) : assignments.length === 0 ? (
          <div className="tm-card-body">
            <EmptyState
              title="No assignments found"
              description="No teacher assignments available."
            />
          </div>
        ) : (
          <>
            <div className="tm-table-wrap">
              <Table className="tm-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={`${assignment.teacherId}-${assignment.id}`}>
                      <TableCell className="tm-name-cell">
                        {assignment.teacherName}
                      </TableCell>
                      <TableCell>
                        <div className="tm-assign-subject">
                          <Badge className="tm-badge-subject">
                            {assignment.subjectCode}
                          </Badge>
                          <span className="tm-assign-subject-name">
                            {assignment.subjectName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="tm-meta-cell">{assignment.className}</TableCell>
                      <TableCell className="tm-meta-cell">
                        {assignment.classSectionName || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className="tm-badge-active">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div style={{ padding: "0.75rem 1rem" }}>
              <Pagination
                page={teachersQuery.data?.number ?? page}
                totalPages={teachersQuery.data?.totalPages ?? 1}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}