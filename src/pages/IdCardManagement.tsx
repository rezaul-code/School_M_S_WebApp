// src/pages/IdCardManagement.tsx

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { Search, Printer, UserX, GraduationCap, LayoutGrid } from "lucide-react";

import { getClassLevels, getClassSections, type IdLabel } from "@/lib/api/options";
import { getIdCards, getBatchIdCards } from "@/lib/api/idCards";
import { Checkbox } from "@/components/ui/checkbox";
import BulkStudentIdCards from "@/components/students/BulkStudentIdCards";
import Pagination from "@/components/common/Pagination";

import "@/styles/student-pages.css";

export default function IdCardManagement() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedClassLevelId, setSelectedClassLevelId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [printData, setPrintData] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const printComponentRef = useRef<HTMLDivElement>(null);

  // ── Class levels — always loaded ──────────────────────────────────────────
  const { data: classLevels = [] } = useQuery<IdLabel[]>({
    queryKey: ["options", "class-levels"],
    queryFn: getClassLevels,
    staleTime: 10 * 60 * 1000,
  });

  // ── Sections — only when a class is selected ──────────────────────────────
  const { data: sections = [], isLoading: sectionsLoading } = useQuery<IdLabel[]>({
    queryKey: ["options", "class-sections", selectedClassLevelId],
    queryFn: () => getClassSections(Number(selectedClassLevelId)),
    enabled: Boolean(selectedClassLevelId),
    staleTime: 5 * 60 * 1000,
  });

  // ── Students — fires as long as at least one filter/search is present ─────
  // With no filters at all we show empty state to avoid loading every student
  const hasAnyFilter = Boolean(selectedClassLevelId || selectedSectionId || search.trim());

  const studentsQuery = useQuery({
    queryKey: ["id-cards-students", page, search, selectedClassLevelId, selectedSectionId],
    queryFn: () =>
      getIdCards({
        classLevelId: selectedClassLevelId ? Number(selectedClassLevelId) : undefined,
        classSectionId: selectedSectionId ? Number(selectedSectionId) : undefined,
        search: search.trim() || undefined,
        page,
        size: 10,
      }),
    enabled: hasAnyFilter,
    placeholderData: (prev) => prev,
  });

  const students = studentsQuery.data?.content ?? [];
  const totalElements = studentsQuery.data?.totalElements ?? 0;
  const totalPages = Math.ceil(totalElements / 10);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleClassChange = (value: string) => {
    setSelectedClassLevelId(value);
    setSelectedSectionId(""); // reset section on class change
    setSelectedIds([]);
    setPage(0);
  };

  const handleSectionChange = (value: string) => {
    setSelectedSectionId(value);
    setSelectedIds([]);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSelectedIds([]);
    setPage(0);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) setSelectedIds([]);
    else setSelectedIds(students.map((s: any) => s.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const triggerBrowserPrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: "Batch_ID_Cards",
  });

  const handlePrintSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsPrinting(true);
      const data = await getBatchIdCards(selectedIds);
      setPrintData(data);
      setTimeout(() => {
        triggerBrowserPrint();
        setIsPrinting(false);
      }, 250);
    } catch (error) {
      console.error(error);
      setIsPrinting(false);
    }
  };

  const selectStyle = (hasValue: boolean, disabled = false): React.CSSProperties => ({
    paddingLeft: "2rem",
    paddingRight: "0.875rem",
    paddingTop: "0.45rem",
    paddingBottom: "0.45rem",
    fontSize: "0.8125rem",
    borderRadius: "0.5rem",
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    color: hasValue ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    outline: "none",
    minWidth: "160px",
  });

  return (
    <div className="sl-page">
      <div className="sl-card">

        {/* ── Toolbar ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid hsl(var(--border))",
          flexWrap: "wrap",
        }}>

          {/* Class Level */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <GraduationCap size={15} style={{ position: "absolute", left: "0.625rem", color: "hsl(var(--muted-foreground))", pointerEvents: "none" }} />
            <select
              value={selectedClassLevelId}
              onChange={(e) => handleClassChange(e.target.value)}
              style={selectStyle(Boolean(selectedClassLevelId))}
            >
              <option value="">All Classes</option>
              {classLevels.map((cl) => (
                <option key={cl.id} value={String(cl.id)}>{cl.label}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <LayoutGrid size={15} style={{ position: "absolute", left: "0.625rem", color: "hsl(var(--muted-foreground))", pointerEvents: "none" }} />
            <select
              value={selectedSectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              disabled={!selectedClassLevelId || sectionsLoading}
              style={selectStyle(Boolean(selectedSectionId), !selectedClassLevelId || sectionsLoading)}
            >
              <option value="">
                {!selectedClassLevelId
                  ? "Select Class First"
                  : sectionsLoading
                  ? "Loading…"
                  : "All Sections"}
              </option>
              {sections.map((cs) => (
                <option key={cs.id} value={String(cs.id)}>{cs.label}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "1.5rem", background: "hsl(var(--border))", flexShrink: 0 }} />

          {/* Search — always enabled */}
          <div className="sl-search-wrap" style={{ flex: 1, minWidth: "180px" }}>
            <Search className="sl-search-icon" />
            <input
              className="sl-search"
              placeholder="Search by name or roll number…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Print */}
          <button
            onClick={handlePrintSelected}
            disabled={selectedIds.length === 0 || isPrinting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            <Printer size={16} />
            {isPrinting ? "Generating..." : `Print Selected (${selectedIds.length})`}
          </button>
        </div>

        {/* ── Table ── */}
        <div className="sl-table-wrap">
          <table className="sl-table">
            <thead>
              <tr>
                <th style={{ width: "2.5rem", paddingLeft: "1.25rem" }}>
                  <Checkbox
                    checked={students.length > 0 && selectedIds.length === students.length}
                    onCheckedChange={toggleSelectAll}
                    disabled={students.length === 0}
                  />
                </th>
                <th>Roll #</th>
                <th>Student</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>

              {/* Idle — no filters yet */}
              {!hasAnyFilter && (
                <tr>
                  <td colSpan={4} style={{ padding: 0, border: "none" }}>
                    <div className="sl-empty">
                      <GraduationCap className="sl-empty-icon" />
                      <p className="sl-empty-title">Search by name, or select a class to get started</p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Loading */}
              {hasAnyFilter && studentsQuery.isLoading && (
                <tr>
                  <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>
                    Loading…
                  </td>
                </tr>
              )}

              {/* Empty */}
              {hasAnyFilter && !studentsQuery.isLoading && students.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 0, border: "none" }}>
                    <div className="sl-empty">
                      <UserX className="sl-empty-icon" />
                      <p className="sl-empty-title">No students found</p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {students.map((student: any) => (
                <tr key={student.id}>
                  <td style={{ paddingLeft: "1.25rem" }}>
                    <Checkbox
                      checked={selectedIds.includes(student.id)}
                      onCheckedChange={() => toggleSelectOne(student.id)}
                    />
                  </td>
                  <td>
                    {student.rollNumber
                      ? <span className="sl-roll">{student.rollNumber}</span>
                      : <span style={{ color: "hsl(var(--muted-foreground))" }}>—</span>}
                  </td>
                  <td>
                    <div className="sl-student-cell">
                      <span className="sl-student-name">{student.fullName}</span>
                    </div>
                  </td>
                  <td>
                    <span className={student.classSectionName ? "sl-section-badge" : "sl-section-badge sl-section-badge--unassigned"}>
                      {student.classSectionName ?? "Unassigned"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {hasAnyFilter && (totalPages > 1 || totalElements > 0) && (
          <div className="sl-footer">
            <span className="sl-footer-count">
              {totalElements > 0
                ? `Showing ${page * 10 + 1}–${Math.min((page + 1) * 10, totalElements)} of ${totalElements} students`
                : "No students"}
            </span>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
          </div>
        )}
      </div>

      {/* Hidden print target */}
      <div className="hidden print:block">
        <BulkStudentIdCards ref={printComponentRef} studentsList={printData} />
      </div>
    </div>
  );
}