// src/lib/examTimetablePrint.ts

export interface PrintComponent {
  componentName: string;
  examDate: string;
  examStartTime: string;
  examEndTime: string;
  durationMinutes: number | null;
  maxMarks: number;
  passMarks: number;
}

export interface PrintSubject {
  subjectName: string;
  subjectCode: string;
  components: PrintComponent[];
}

export interface PrintExamData {
  name: string;
  academicYearName: string;
  classLevelName: string;
  startDate: string;
  endDate: string;
  status: string;
  subjects: PrintSubject[];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(t: string): string {
  if (!t) return "—";
  try {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch {
    return t;
  }
}

export function openExamTimetablePrint(exam: PrintExamData): void {
  let tableRows = "";
  let rowIndex = 0;

  exam.subjects.forEach((subject) => {
    subject.components.forEach((comp, idx) => {
      const isFirst = idx === 0;
      const rowspan = subject.components.length;
      const isEven = rowIndex % 2 === 0;
      const rowBg = isEven ? "#ffffff" : "#f5f8fc";

      const subjectCell = isFirst
        ? `<td rowspan="${rowspan}" style="padding:12px 14px; border-right:2px solid #378ADD; vertical-align:middle; background:#ffffff;">
            <div style="font-weight:600; font-size:13px; color:#1a2540;">${subject.subjectName}</div>
            <div style="font-size:10px; color:#6b7a99; text-transform:uppercase; letter-spacing:0.8px; margin-top:2px;">${subject.subjectCode}</div>
           </td>`
        : "";

      tableRows += `
        <tr style="background:${rowBg}; border-bottom:0.5px solid #e2e8f0;">
          ${subjectCell}
          <td style="padding:12px 14px; font-size:12px; color:#1a2540;">${comp.componentName}</td>
          <td style="padding:12px 14px; font-size:12px; color:#185FA5; font-weight:500;">${formatDate(comp.examDate)}</td>
          <td style="padding:12px 14px; text-align:center; font-size:12px; color:#1a2540; font-variant-numeric:tabular-nums;">${formatTime(comp.examStartTime)}</td>
          <td style="padding:12px 14px; text-align:center; font-size:12px; color:#1a2540; font-variant-numeric:tabular-nums;">${formatTime(comp.examEndTime)}</td>
          <td style="padding:12px 14px; text-align:center; font-size:12px; color:#6b7a99;">${comp.durationMinutes ? `${comp.durationMinutes} min` : "—"}</td>
          <td style="padding:12px 14px; text-align:center; font-weight:600; font-size:13px; color:#1a2540;">${comp.maxMarks}</td>
          <td style="padding:12px 14px; text-align:center; font-weight:600; font-size:13px; color:#0F6E56;">${comp.passMarks}</td>
        </tr>`;

      rowIndex++;
    });
  });

  const totalMax = exam.subjects.reduce(
    (sum, s) => sum + s.components.reduce((cs, c) => cs + (c.maxMarks || 0), 0),
    0
  );

  const totalSubjects = exam.subjects.length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${exam.name} — Exam Timetable</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #f0f4f8;
      color: #1a2540;
      padding: 32px 24px;
      min-height: 100vh;
    }

    .page {
      max-width: 980px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(15,32,68,0.08);
    }

    /* ── Header ── */
    .header {
      padding: 36px 48px 30px;
      text-align: center;
      border-bottom: 2px solid #378ADD;
    }
    .header-badge {
      display: inline-block;
      background: #E6F1FB;
      border: 0.5px solid #85B7EB;
      border-radius: 999px;
      padding: 4px 16px;
      font-size: 10px;
      letter-spacing: 2px;
      color: #0C447C;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .header-title {
      font-family: 'EB Garamond', serif;
      font-size: 34px;
      font-weight: 700;
      color: #1a2540;
      margin-bottom: 5px;
      line-height: 1.15;
    }
    .header-sub {
      font-size: 13px;
      color: #6b7a99;
      font-weight: 300;
      margin-bottom: 22px;
    }
    .meta-chips {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .chip {
      background: #f5f8fc;
      border: 0.5px solid #d0daea;
      border-radius: 999px;
      padding: 5px 14px;
      font-size: 11px;
      color: #6b7a99;
    }
    .chip span {
      color: #185FA5;
      font-weight: 600;
      margin-right: 4px;
    }

    /* ── Table section ── */
    .table-wrap {
      padding: 24px 36px 8px;
    }
    .section-label {
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #6b7a99;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      table-layout: fixed;
    }
    colgroup col:nth-child(1) { width: 15%; }
    colgroup col:nth-child(2) { width: 13%; }
    colgroup col:nth-child(3) { width: 17%; }
    colgroup col:nth-child(4) { width: 11%; }
    colgroup col:nth-child(5) { width: 11%; }
    colgroup col:nth-child(6) { width: 11%; }
    colgroup col:nth-child(7) { width: 11%; }
    colgroup col:nth-child(8) { width: 11%; }

    thead tr {
      background: #f5f8fc;
      border-bottom: 1px solid #d0daea;
    }
    thead th {
      padding: 10px 14px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1.3px;
      text-transform: uppercase;
      color: #6b7a99;
    }
    thead th.center { text-align: center; }

    tbody tr { border-bottom: 0.5px solid #e2e8f0; }
    tbody tr:last-child { border-bottom: none; }

    .total-row td {
      background: #E6F1FB !important;
      border-top: 1.5px solid #378ADD !important;
      padding: 12px 14px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #185FA5;
    }
    .total-row .total-val {
      text-align: center;
      font-size: 14px;
      color: #0C447C;
      letter-spacing: 0;
    }

    /* ── Footer ── */
    .footer {
      border-top: 0.5px solid #e2e8f0;
      margin: 0 36px;
      padding: 18px 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-left {
      font-size: 11px;
      color: #6b7a99;
    }
    .footer-left strong { color: #1a2540; }
    .sig-line {
      width: 148px;
      height: 1px;
      background: #d0daea;
      margin-left: auto;
      margin-bottom: 5px;
    }
    .sig-label {
      font-size: 10px;
      color: #6b7a99;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      text-align: right;
    }

    /* ── Print button ── */
    .print-btn-wrap {
      text-align: center;
      padding: 22px;
      background: #f0f4f8;
    }
    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #185FA5;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 11px 30px;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 0.3px;
    }
    .print-btn:hover { background: #0C447C; }

    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; border-radius: 0; max-width: 100%; }
      .print-btn-wrap { display: none; }
      @page { size: A4 landscape; margin: 12mm 16mm; }
    }
  </style>
</head>
<body>

<div class="print-btn-wrap">
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>

<div class="page">

  <div class="header">
    <div class="header-badge">Official Examination Schedule</div>
    <div class="header-title">${exam.name}</div>
    <div class="header-sub">${exam.academicYearName} &nbsp;·&nbsp; ${exam.classLevelName}</div>
    <div class="meta-chips">
      <div class="chip"><span>From</span>${formatDate(exam.startDate)}</div>
      <div class="chip"><span>To</span>${formatDate(exam.endDate)}</div>
      <div class="chip"><span>Subjects</span>${totalSubjects}</div>
      <div class="chip"><span>Total marks</span>${totalMax}</div>
    </div>
  </div>

  <div class="table-wrap">
    <div class="section-label">Examination timetable</div>
    <table>
      <colgroup>
        <col><col><col><col><col><col><col><col>
      </colgroup>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Component</th>
          <th>Exam date</th>
          <th class="center">Start</th>
          <th class="center">End</th>
          <th class="center">Duration</th>
          <th class="center">Max marks</th>
          <th class="center">Pass marks</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        <tr class="total-row">
          <td colspan="6" style="text-align:right;">Total maximum marks</td>
          <td class="total-val">${totalMax}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div class="footer-left">
      Generated on <strong>${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</strong>
      &nbsp;·&nbsp; ${exam.name} &nbsp;·&nbsp; ${exam.academicYearName}
    </div>
    <div>
      <div class="sig-line"></div>
      <div class="sig-label">Principal / Exam controller</div>
    </div>
  </div>

</div>

</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}