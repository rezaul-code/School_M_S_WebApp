// src/pages/Students.tsx

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  GraduationCap,
  MoreHorizontal,
  Search,
  Users,
  UserX,
} from "lucide-react";

import { listStudents } from "@/lib/api/students";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from "@/components/common/Pagination";

import "@/styles/student-pages.css";

// ── Helpers ────────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── Skeleton loading rows ──────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="sl-loading-row">
          <td colSpan={6} style={{ padding: 0, border: "none" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.25rem 2rem 1fr 1fr 6rem 6rem 5rem 3rem",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.875rem 1.25rem",
                borderBottom: "1px solid hsl(var(--border) / 0.5)",
              }}
            >
              <div />
              <div className="sp-skel" style={{ width: "2rem", height: "2rem", borderRadius: "50%" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div className="sp-skel" style={{ height: "0.8125rem", width: `${55 + (i % 3) * 15}%` }} />
                <div className="sp-skel" style={{ height: "0.7rem", width: "40%" }} />
              </div>
              <div className="sp-skel" style={{ height: "0.8rem", width: "70%" }} />
              <div className="sp-skel" style={{ height: "1.25rem", width: "4.5rem", borderRadius: "0.375rem" }} />
              <div className="sp-skel" style={{ height: "1.25rem", width: "5rem", borderRadius: "0.5rem" }} />
              <div className="sp-skel" style={{ height: "0.8rem", width: "5rem" }} />
              <div className="sp-skel" style={{ height: "2rem", width: "2rem", borderRadius: "0.4375rem" }} />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function Students() {
  const navigate = useNavigate();

  const [page, setPage]   = useState(0);
  const [search, setSearch] = useState("");

  // Filters (preserved — kept for API compatibility)
  const [selectedClass]   = useState("");
  const [selectedSection] = useState("");
  const [selectedStatus]  = useState("");

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
    placeholderData: (previousData) => previousData,
  });

  const students      = studentsQuery.data?.content      ?? [];
  const totalElements = studentsQuery.data?.totalElements ?? 0;

  // API only supports classSectionId + search; remaining filters client-side.
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass   = !selectedClass   || selectedClass   === "";
      const matchesSection =
        !selectedSection ||
        (s.classSectionId ?? "").toString() === selectedSection;
      const matchesStatus  =
        !selectedStatus ||
        (s.admissionDate ? "admitted" : "pending") === selectedStatus;
      return matchesClass && matchesSection && matchesStatus;
    });
  }, [students, selectedClass, selectedSection, selectedStatus]);

  const totalPages = Math.ceil(totalElements / 10);

  return (
    <div className="sl-page">

      {/* ── Page header banner ── */}
      <div className="sl-header">
        <div className="sl-header-left">
          <div className="sl-header-icon">
            <GraduationCap />
          </div>
          <div>
            <h1 className="sl-header-title">Students</h1>
            <p className="sl-header-sub">
              Manage admissions, profiles and fee records
            </p>
          </div>
        </div>

        <div className="sl-header-actions">
          {totalElements > 0 && (
            <div className="sp-hero-badge">
              <Users size={11} />
              {totalElements} enrolled
            </div>
          )}
        </div>
      </div>

      {/* ── Main card ── */}
      <div className="sl-card">

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.875rem 1.25rem",
            borderBottom: "1px solid hsl(var(--border))",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <div className="sl-toolbar">
            <div className="sl-search-wrap">
              <Search className="sl-search-icon" />
              <input
                className="sl-search"
                placeholder="Search by name, email or roll number…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {!studentsQuery.isLoading && totalElements > 0 && (
              <div className="sl-count-pill">
                <Users size={12} />
                {totalElements} student{totalElements !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="sl-table-wrap">
          <table className="sl-table">
            <thead>
              <tr>
                <th style={{ width: "1.25rem" }} />
                <th style={{ width: "2.5rem" }} />
                <th>Student</th>
                <th>Email</th>
                <th>Roll #</th>
                <th>Section</th>
                <th>Admitted</th>
                <th style={{ width: "3.5rem" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {/* Loading */}
              {studentsQuery.isLoading && <SkeletonRows />}

              {/* Empty */}
              {!studentsQuery.isLoading && students.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 0, border: "none" }}>
                    <div className="sl-empty">
                      <UserX className="sl-empty-icon" />
                      <p className="sl-empty-title">
                        {search ? "No students match your search" : "No students found"}
                      </p>
                      <p className="sl-empty-desc">
                        {search
                          ? `Try a different name, email or roll number.`
                          : "Students will appear here once they have been admitted."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!studentsQuery.isLoading &&
                students.map((student, idx) => (
                  <tr key={student.id}>
                    {/* Row number */}
                    <td
                      style={{
                        fontSize: "0.72rem",
                        color: "hsl(var(--muted-foreground))",
                        fontWeight: 500,
                        textAlign: "right",
                        paddingRight: "0.25rem",
                        userSelect: "none",
                      }}
                    >
                      {page * 10 + idx + 1}
                    </td>

                    {/* Avatar */}
                    <td style={{ paddingRight: 0 }}>
                      <div className="sl-student-avatar">
                        {getInitials(student.fullName)}
                      </div>
                    </td>

                    {/* Student name + phone */}
                    <td>
                      <div className="sl-student-cell" style={{ gap: 0, flexDirection: "column", alignItems: "flex-start" }}>
                        <span className="sl-student-name">{student.fullName}</span>
                        {student.phone && (
                          <span className="sl-student-phone">{student.phone}</span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td>
                      <span className="sl-email">{student.email || "—"}</span>
                    </td>

                    {/* Roll # */}
                    <td>
                      {student.rollNumber ? (
                        <span className="sl-roll">{student.rollNumber}</span>
                      ) : (
                        <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.8rem" }}>—</span>
                      )}
                    </td>

                    {/* Section */}
                    <td>
                      <span
                        className={
                          student.classSectionName
                            ? "sl-section-badge"
                            : "sl-section-badge sl-section-badge--unassigned"
                        }
                      >
                        {student.classSectionName ?? "Unassigned"}
                      </span>
                    </td>

                    {/* Admission date */}
                    <td>
                      <span className="sl-date">
                        {student.admissionDate
                          ? format(new Date(student.admissionDate), "MMM dd, yyyy")
                          : "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="sl-action-btn"
                            aria-label={`Actions for ${student.fullName}`}
                          >
                            <MoreHorizontal />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onSelect={() => navigate(`/students/${student.id}`)}
                          >
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onSelect={() =>
                              navigate(`/students/${student.id}/fee-summary`)
                            }
                          >
                            Fee Summary
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {(totalPages > 1 || totalElements > 0) && (
          <div className="sl-footer">
            <span className="sl-footer-count">
              {totalElements > 0
                ? `Showing ${page * 10 + 1}–${Math.min((page + 1) * 10, totalElements)} of ${totalElements} students`
                : "No students"}
            </span>

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