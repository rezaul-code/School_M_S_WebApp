// src/pages/IdCardManagement.tsx

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { IdCard, Search, Printer, UserX } from "lucide-react";

import { listStudents,  } from "@/lib/api/students";
import { getBatchIdCards } from "@/lib/api/idCards";
import { Checkbox } from "@/components/ui/checkbox";
import BulkStudentIdCards from "@/components/students/BulkStudentIdCards";
import Pagination from "@/components/common/Pagination";

import "@/styles/student-pages.css";

export default function IdCardManagement() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [printData, setPrintData] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const printComponentRef = useRef<HTMLDivElement>(null);

  const studentsQuery = useQuery({
    queryKey: ["id-cards-students", page, search],
    queryFn: () => listStudents({ page, size: 10, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const students = studentsQuery.data?.content ?? [];
  const totalElements = studentsQuery.data?.totalElements ?? 0;
  const totalPages = Math.ceil(totalElements / 10);

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) setSelectedIds([]);
    else setSelectedIds(students.map((s: any) => s.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const triggerBrowserPrint = useReactToPrint({
    contentRef: printComponentRef, // <--- Updated for v3
    documentTitle: `Batch_ID_Cards`,
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

  return (
    <div className="sl-page">
      
     

      {/* ── Main card ── */}
      <div className="sl-card">
        
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", padding: "0.875rem 1.25rem", borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="sl-toolbar">
            <div className="sl-search-wrap">
              <Search className="sl-search-icon" />
              <input
                className="sl-search"
                placeholder="Search by name or roll number…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="sl-table-wrap">
          <table className="sl-table">
            <thead>
              <tr>
                <th style={{ width: "2.5rem", paddingLeft: "1.25rem" }}>
                  <Checkbox 
                    checked={students.length > 0 && selectedIds.length === students.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th>Roll #</th>
                <th>Student</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              {!studentsQuery.isLoading && students.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 0, border: "none" }}>
                    <div className="sl-empty">
                      <UserX className="sl-empty-icon" />
                      <p className="sl-empty-title">No students found</p>
                    </div>
                  </td>
                </tr>
              )}

              {students.map((student) => (
                <tr key={student.id}>
                  <td style={{ paddingLeft: "1.25rem" }}>
                    <Checkbox 
                      checked={selectedIds.includes(student.id)}
                      onCheckedChange={() => toggleSelectOne(student.id)}
                    />
                  </td>
                  <td>
                    {student.rollNumber ? (
                      <span className="sl-roll">{student.rollNumber}</span>
                    ) : (
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
                    )}
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

        {/* Pagination footer */}
        {(totalPages > 1 || totalElements > 0) && (
          <div className="sl-footer">
            <span className="sl-footer-count">
              {totalElements > 0 ? `Showing ${page * 10 + 1}–${Math.min((page + 1) * 10, totalElements)} of ${totalElements} students` : "No students"}
            </span>
            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            )}
          </div>
        )}
      </div>

      {/* HIDDEN PRINT RENDERER */}
      <div className="hidden print:block">
        <BulkStudentIdCards ref={printComponentRef} studentsList={printData} />
      </div>
    </div>
  );
}