// src/components/print/ReportCardPreview.tsx
// Usage: <ReportCardButton row={row} examDetail={examDetail} subjectNames={subjectNames} rank={rank} totalStudents={totalStudents} />

import React, { useRef, useState } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ComponentMark {
  id: number;
  componentName: string;
  marksObtained: number | null;
  maxMarks: number;
  passMarks: number | null;
  isAbsent: boolean;
}

interface SubjectMark {
  id: number;
  status: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  isAbsent: boolean;
  components: ComponentMark[];
}

interface StudentRow {
  enrollmentId: number;
  studentName: string;
  rollNumber: string;
  sectionName: string;
  totalObtained: number;
  totalMax: number;
  overallStatus: string;
  subjects: Record<string, SubjectMark>;
}

interface ExamDetail {
  name: string;
  classLevelName: string;
  academicYearName: string;
  startDate: string;
  endDate: string;
}

interface ReportCardPreviewProps {
  row: StudentRow;
  examDetail: ExamDetail;
  subjectNames: string[];
  rank: number;
  totalStudents: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(obtained: number, max: number) {
  return max > 0 ? Math.round((obtained / max) * 100) : 0;
}

function grade(p: number): { letter: string; bg: string; text: string; border: string } {
  if (p >= 90) return { letter: "A+", bg: "#EAF3DE", text: "#27500A", border: "#97C459" };
  if (p >= 80) return { letter: "A",  bg: "#EAF3DE", text: "#27500A", border: "#97C459" };
  if (p >= 70) return { letter: "B+", bg: "#E6F1FB", text: "#0C447C", border: "#85B7EB" };
  if (p >= 60) return { letter: "B",  bg: "#E6F1FB", text: "#0C447C", border: "#85B7EB" };
  if (p >= 50) return { letter: "C",  bg: "#FAEEDA", text: "#633806", border: "#EF9F27" };
  if (p >= 35) return { letter: "D",  bg: "#FAEEDA", text: "#633806", border: "#EF9F27" };
  return { letter: "F", bg: "#FCEBEB", text: "#791F1F", border: "#F09595" };
}

function barColor(p: number) {
  if (p >= 60) return "#185FA5";
  if (p >= 35) return "#BA7517";
  return "#A32D2D";
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ row, examDetail, subjectNames, rank, totalStudents }: ReportCardPreviewProps) {
  const totalPct = pct(row.totalObtained, row.totalMax);
  const overallGrade = grade(totalPct);
  const passed = totalPct >= 35;

  // Clean section name (strip class prefix if present e.g. "CLASS_ONE - MOON" → "Moon")
  const sectionDisplay = row.sectionName.includes(" - ")
    ? row.sectionName.split(" - ").pop() ?? row.sectionName
    : row.sectionName;

  const s: Record<string, React.CSSProperties> = {
    card: {
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      overflow: "hidden",
      width: "100%",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: "13px",
      color: "#111827",
    },
    accent: {
      height: "3px",
      background: "#2563eb",
    },
    head: {
      padding: "20px 24px 16px",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    examName: {
      fontSize: "16px",
      fontWeight: 600,
      margin: "0 0 3px",
      color: "#111827",
    },
    metaText: {
      fontSize: "12px",
      color: "#6b7280",
      margin: 0,
    },
    passPillBase: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "11px",
      fontWeight: 500,
      marginTop: "10px",
      padding: "3px 10px",
      borderRadius: "99px",
      border: "1px solid",
    },
    passPillPassed: {
      background: "#f0fdf4",
      color: "#16a34a",
      borderColor: "#86efac",
    },
    passPillFailed: {
      background: "#fef2f2",
      color: "#dc2626",
      borderColor: "#fca5a5",
    },
    gradeBlock: {
      textAlign: "right",
    },
    gradeLabel: {
      fontSize: "11px",
      color: "#6b7280",
      margin: "0 0 2px",
    },
    gradeVal: {
      fontSize: "28px",
      fontWeight: 600,
      lineHeight: 1,
      color: overallGrade.text,
    },
    gradePct: {
      fontSize: "12px",
      color: "#6b7280",
      marginTop: "2px",
    },
    studentRow: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      borderBottom: "1px solid #e5e7eb",
      background: "#f9fafb",
    },
    field: {
      padding: "10px 16px",
      borderRight: "1px solid #e5e7eb",
    },
    fieldLast: {
      padding: "10px 16px",
    },
    fieldLabel: {
      fontSize: "11px",
      color: "#6b7280",
      marginBottom: "2px",
    },
    fieldVal: {
      fontSize: "13px",
      fontWeight: 500,
      color: "#111827",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      padding: "9px 14px",
      fontSize: "11px",
      fontWeight: 500,
      color: "#6b7280",
      textAlign: "left",
      borderBottom: "1px solid #d1d5db",
    },
    thR: {
      padding: "9px 14px",
      fontSize: "11px",
      fontWeight: 500,
      color: "#6b7280",
      textAlign: "right",
      borderBottom: "1px solid #d1d5db",
    },
    thC: {
      padding: "9px 14px",
      fontSize: "11px",
      fontWeight: 500,
      color: "#6b7280",
      textAlign: "center",
      borderBottom: "1px solid #d1d5db",
    },
    td: {
      padding: "10px 14px",
      color: "#111827",
      verticalAlign: "middle",
      borderBottom: "1px solid #f3f4f6",
    },
    tdR: {
      padding: "10px 14px",
      color: "#111827",
      textAlign: "right",
      verticalAlign: "middle",
      borderBottom: "1px solid #f3f4f6",
    },
    tdC: {
      padding: "10px 14px",
      color: "#111827",
      textAlign: "center",
      verticalAlign: "middle",
      borderBottom: "1px solid #f3f4f6",
    },
    totalTd: {
      padding: "11px 14px",
      fontWeight: 600,
      color: "#111827",
      background: "#f3f4f6",
    },
    totalTdR: {
      padding: "11px 14px",
      fontWeight: 600,
      color: "#111827",
      background: "#f3f4f6",
      textAlign: "right",
    },
    totalTdC: {
      padding: "11px 14px",
      fontWeight: 600,
      color: "#111827",
      background: "#f3f4f6",
      textAlign: "center",
    },
    legend: {
      padding: "10px 24px",
      borderTop: "1px solid #e5e7eb",
      background: "#f9fafb",
      display: "flex",
      gap: "20px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    legendLabel: {
      fontSize: "11px",
      color: "#6b7280",
    },
    sig: {
      display: "flex",
      justifyContent: "space-between",
      padding: "16px 24px",
      borderTop: "1px solid #e5e7eb",
    },
    sigBox: {
      width: "120px",
      textAlign: "center",
    },
    sigLine: {
      borderBottom: "1px solid #d1d5db",
      height: "24px",
      marginBottom: "6px",
    },
    sigLabel: {
      fontSize: "11px",
      color: "#6b7280",
    },
  };

  return (
    <div style={s.card}>
      <div style={s.accent} />

      {/* Header */}
      <div style={s.head}>
        <div>
          <p style={s.examName}>{examDetail.name} — Progress Report</p>
          <p style={s.metaText}>{examDetail.classLevelName} &nbsp;·&nbsp; {examDetail.academicYearName} &nbsp;·&nbsp; {fmt(examDetail.startDate)} – {fmt(examDetail.endDate)}</p>
          <div style={{ ...s.passPillBase, ...(passed ? s.passPillPassed : s.passPillFailed) }}>
            {passed ? "✓ Passed" : "✗ Failed"}
          </div>
        </div>
        <div style={s.gradeBlock}>
          <div style={s.gradeLabel}>Overall grade</div>
          <div style={s.gradeVal}>{overallGrade.letter}</div>
          <div style={s.gradePct}>{totalPct}%</div>
        </div>
      </div>

      {/* Student info */}
      <div style={s.studentRow}>
        {[
          { label: "Student", value: row.studentName },
          { label: "Roll no.", value: row.rollNumber },
          { label: "Section", value: sectionDisplay },
          { label: "Rank", value: `${rank} of ${totalStudents}` },
        ].map((f, i) => (
          <div key={f.label} style={i < 3 ? s.field : s.fieldLast}>
            <div style={s.fieldLabel}>{f.label}</div>
            <div style={s.fieldVal}>{f.value}</div>
          </div>
        ))}
      </div>

      {/* Marks table */}
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: "18%" }}>Subject</th>
            <th style={{ ...s.th, width: "38%" }}>Components</th>
            <th style={s.thR}>Marks</th>
            <th style={s.thR}>Max</th>
            <th style={{ ...s.thR, width: "14%" }}>Score</th>
            <th style={{ ...s.thC, width: "10%" }}>Grade</th>
          </tr>
        </thead>
        <tbody>
          {subjectNames.map((name) => {
            const mark = row.subjects[name];
            if (!mark) return null;
            const p = pct(mark.totalMarksObtained, mark.totalMaxMarks);
            const g = grade(p);
            return (
              <tr key={name}>
                <td style={{ ...s.td, fontWeight: 500 }}>{name}</td>
                <td style={s.td}>
                  {mark.isAbsent ? (
                    <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Absent</span>
                  ) : (
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      {mark.components.map((c, i) => (
                        <span key={c.id}>{i > 0 ? " · " : ""}{c.componentName} {c.isAbsent ? "Ab" : `${c.marksObtained ?? "—"}/${c.maxMarks}`}</span>
                      ))}
                    </span>
                  )}
                </td>
                <td style={s.tdR}>{mark.isAbsent ? "—" : mark.totalMarksObtained}</td>
                <td style={{ ...s.tdR, color: "#6b7280" }}>{mark.totalMaxMarks}</td>
                <td style={s.tdR}>
                  {!mark.isAbsent && (
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                      <span style={{ width: "40px", height: "3px", background: "#e5e7eb", borderRadius: "99px", overflow: "hidden", display: "inline-block" }}>
                        <span style={{ display: "block", height: "100%", width: `${p}%`, background: barColor(p), borderRadius: "99px" }} />
                      </span>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>{p}%</span>
                    </span>
                  )}
                </td>
                <td style={s.tdC}>
                  {!mark.isAbsent && (
                    <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "6px", background: g.bg, color: g.text, border: `1px solid ${g.border}` }}>
                      {g.letter}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ ...s.totalTd }} colSpan={2}>Total</td>
            <td style={s.totalTdR}>{row.totalObtained}</td>
            <td style={{ ...s.totalTdR, fontWeight: 400, color: "#6b7280" }}>{row.totalMax}</td>
            <td style={s.totalTdR}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                <span style={{ width: "40px", height: "3px", background: "#e5e7eb", borderRadius: "99px", overflow: "hidden", display: "inline-block" }}>
                  <span style={{ display: "block", height: "100%", width: `${totalPct}%`, background: barColor(totalPct), borderRadius: "99px" }} />
                </span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>{totalPct}%</span>
              </span>
            </td>
            <td style={s.totalTdC}>
              <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "6px", background: overallGrade.bg, color: overallGrade.text, border: `1px solid ${overallGrade.border}` }}>
                {overallGrade.letter}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Grading scale */}
      <div style={s.legend}>
        <span style={s.legendLabel}>Grading scale:</span>
        {[["A+","≥90%"],["A","≥80%"],["B+","≥70%"],["B","≥60%"],["C","≥50%"],["D","≥35%"],["F","<35%"]].map(([l, r]) => (
          <span key={l} style={{ fontSize: "11px", color: "#6b7280" }}><strong style={{ color: "#374151" }}>{l}</strong> {r}</span>
        ))}
      </div>

      {/* Signatures */}
      <div style={s.sig}>
        {["Class teacher", "Principal", "Parent / guardian"].map((role) => (
          <div key={role} style={s.sigBox}>
            <div style={s.sigLine} />
            <div style={s.sigLabel}>{role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Print helper ──────────────────────────────────────────────────────────────
function injectPrintStyles() {
  const id = "rc-print-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @media print {
      body > *:not(#rc-print-portal) { display: none !important; }
      #rc-print-portal { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; padding: 24px; }
      @page { size: A4; margin: 16mm; }
    }
  `;
  document.head.appendChild(style);
}

// ── Export ────────────────────────────────────────────────────────────────────
export function ReportCardButton(props: ReportCardPreviewProps) {
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    injectPrintStyles();
    let portal = document.getElementById("rc-print-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "rc-print-portal";
      portal.style.display = "none";
      document.body.appendChild(portal);
    }
    portal.innerHTML = printRef.current?.innerHTML ?? "";
    portal.style.display = "block";
    window.print();
    portal.style.display = "none";
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        title="Print report card"
      >
        <Printer className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[720px] w-full p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <div className="text-sm font-medium text-foreground">Report card</div>
              <div className="text-xs text-muted-foreground">{props.row.studentName} &nbsp;·&nbsp; {props.examDetail.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handlePrint} className="gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Print / Save PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[80vh] p-5 bg-muted/30">
            <div ref={printRef}>
              <ReportCard {...props} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReportCard;