// src/pages/StudentFeeStatementPdf.tsx
//
// Route:  /reports/student-statement/pdf?studentId=...&academicYearId=...
//
// Redesigned to match the Sarbajanin Academy receipt theme:
// clean white background, minimal borders, receipt-style layout,
// OFFICE COPY badge, detach-here dashed footer.
//
// Register in App.tsx inside the protected routes:
//   <Route path="/reports/student-statement/pdf" element={<StudentFeeStatementPdf />} />

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery }        from '@tanstack/react-query';
import { Loader2 }         from 'lucide-react';

import {
  getStudentFeeStatement,
  type StudentFeeStatementResponse,
  type StatementLineItem,
} from '@/lib/api/studentFeeStatement';

// ─── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_NAME    = 'SARBAJANIN ACADEMY';
const SCHOOL_ADDRESS = 'Survey No. 42, Gachibowli, Hyderabad – 500032';
const SCHOOL_EMAIL   = 'accounts@sarbajanin.edu.in';
const SCHOOL_PHONE   = '+91-40-12345678';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso)
    .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

// Fee-type accent colours (period badge)
const FEE_PERIOD_COLOR: Record<string, string> = {
  TUITION:   '#d97706',
  TRANSPORT: '#2563eb',
  ACTIVITY:  '#7c3aed',
  EXAM:      '#db2777',
  ADMISSION: '#0d9488',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'baseline' }}>
      <span style={{ fontSize: 11, color: '#6b7280', minWidth: 68 }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#111827', letterSpacing: '0.01em' }}>{value}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentFeeStatementPdf() {
  const [params]       = useSearchParams();
  const studentId      = params.get('studentId') ?? '';
  const academicYearId = Number(params.get('academicYearId') ?? 0);

  const { data: stmt, isLoading, isError } = useQuery<StudentFeeStatementResponse>({
    queryKey: ['student-statement-pdf', studentId, academicYearId],
    queryFn:  () => getStudentFeeStatement(studentId, academicYearId),
    enabled:  Boolean(studentId && academicYearId),
    staleTime: 60_000,
  });

  // Auto-print once data is ready
  useEffect(() => {
    if (stmt) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [stmt]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, fontFamily: 'sans-serif', color: '#6b7280' }}>
        <Loader2 style={{ width: 26, height: 26, animation: 'spin 1s linear infinite' }} />
        Preparing statement…
      </div>
    );
  }

  // ── Error ──
  if (isError || !stmt) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#ef4444' }}>
        Could not load statement. Please close this tab and try again.
      </div>
    );
  }

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'DM Sans', sans-serif;
          background: #e5e7eb;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page { size: A4 portrait; margin: 0; }
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
          .paper {
            box-shadow: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
            min-height: 100vh !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Screen-only toolbar ── */}
      <div
        className="no-print"
        style={{
          background: '#111827',
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'sans-serif' }}>
          Receipt Preview — {stmt.studentName} · {stmt.academicYearName}
        </span>
        <button
          onClick={() => window.print()}
          style={{
            background: '#fff',
            color: '#111827',
            border: 'none',
            borderRadius: 6,
            padding: '7px 18px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.03em',
          }}
        >
          Print / Save as PDF
        </button>
      </div>

      {/* ── A4 Paper ── */}
      <div
        className="paper"
        style={{
          width: 794,
          minHeight: 1123,
          margin: '24px auto',
          background: '#fff',
          boxShadow: '0 4px 40px rgba(0,0,0,0.14)',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ════════════════════════════════════════════
            HEADER — logo · school name · office copy
            ════════════════════════════════════════════ */}
        <div style={{ padding: '28px 36px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>

          {/* Left: logo + school name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Circular logo */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '1.5px solid #d1d5db',
              background: '#f9fafb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              flexShrink: 0,
            }}>
              🏫
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                {SCHOOL_NAME}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4 }}>
                Fee Payment Receipt
              </div>
            </div>
          </div>

          {/* Right: office copy badge + receipt no */}
          <div style={{ textAlign: 'right', paddingTop: 2 }}>
            <div style={{
              display: 'inline-block',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#6b7280',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Office Copy
            </div>
            <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Receipt No.
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '0.03em', marginTop: 2 }}>
              {stmt.referenceNo}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #e5e7eb', margin: '0 36px' }} />

        {/* ════════════════════════════════════════════
            STUDENT + RECEIPT INFO
            ════════════════════════════════════════════ */}
        <div style={{
          padding: '18px 36px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
        }}>
          {/* Left column */}
          <div>
            <InfoField label="Student:"  value={stmt.studentName} />
            <InfoField label="Adm No:"   value={stmt.registrationNo ?? stmt.rollNumber ?? '—'} />
            <InfoField label="Class:"    value={stmt.classSectionName} />
          </div>

          {/* Right column */}
          <div style={{ textAlign: 'right', paddingLeft: 32 }}>
            <InfoField label="Date:"    value={fmtDate(stmt.generatedOn)} />
        
          </div>
        </div>

        {/* ════════════════════════════════════════════
            FEE LINE-ITEMS TABLE
            ════════════════════════════════════════════ */}
        <div style={{ padding: '0 36px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>

            {/* Table head */}
            <thead>
              <tr style={{ borderTop: '1.5px solid #111827', borderBottom: '1.5px solid #111827' }}>
                <th style={{ padding: '9px 8px 9px 0', textAlign: 'left', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#374151' }}>
                  Particulars
                </th>
                <th style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#374151', width: 130 }}>
                  Required (₹)
                </th>
                <th style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16a34a', width: 130 }}>
                  Paid (₹)
                </th>
                <th style={{ padding: '9px 0 9px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#dc2626', width: 120 }}>
                  Balance (₹)
                </th>
              </tr>
            </thead>

            {/* Table body */}
            <tbody>
              {stmt.lineItems.map((row: StatementLineItem, idx: number) => {
                const periodColor = FEE_PERIOD_COLOR[row.feeType] ?? '#6b7280';
                const isLast      = idx === stmt.lineItems.length - 1;
                return (
                  <tr
                    key={row.ledgerId}
                    style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}
                  >
                    {/* Particulars */}
                    <td style={{ padding: '11px 8px 11px 0', color: '#111827' }}>
                      <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        {row.feeTypeLabel.replace(' Fee', '')}
                      </span>
                      {row.period && (
                        <span style={{
                          marginLeft: 8,
                          fontSize: 10,
                          color: periodColor,
                          fontWeight: 500,
                        }}>
                          ({row.period})
                        </span>
                      )}
                    </td>

                    {/* Required */}
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: '#374151', fontWeight: 500 }}>
                      {INR(row.netDue)}
                    </td>

                    {/* Paid */}
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>
                      {INR(row.amountPaid)}
                    </td>

                    {/* Balance */}
                    <td style={{ padding: '11px 0 11px 8px', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                      {INR(row.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Grand total */}
            <tfoot>
              {/* Discount row (conditional) */}
              {stmt.totalDiscount > 0 && (
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 8px 8px 0', fontSize: 10, color: '#6b7280' }}>
                    Scholarship / Discount applied
                  </td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', color: '#6b7280', fontSize: 10 }}>
                    {INR(stmt.grossAmount)}
                  </td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', color: '#16a34a', fontWeight: 600, fontSize: 10 }}>
                    –{INR(stmt.totalDiscount)}
                  </td>
                  <td style={{ padding: '8px 0 8px 8px', textAlign: 'right', color: '#9ca3af', fontSize: 10 }}>
                    —
                  </td>
                </tr>
              )}

              {/* Grand total row */}
              <tr style={{ borderTop: '1.5px solid #111827', borderBottom: '1.5px solid #111827' }}>
                <td style={{ padding: '10px 8px 10px 0', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#111827' }}>
                  Grand Total
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                  {INR(stmt.netAmount)}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                  {INR(stmt.totalPaid)}
                </td>
                <td style={{ padding: '10px 0 10px 8px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                  {INR(stmt.balanceDue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ════════════════════════════════════════════
            SPACER (pushes footer down naturally)
            ════════════════════════════════════════════ */}
        <div style={{ flex: 1, minHeight: 48 }} />

        {/* ════════════════════════════════════════════
            NOTES
            ════════════════════════════════════════════ */}
        <div style={{ padding: '0 36px', marginBottom: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
            Note
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.65, maxWidth: 480 }}>
            Payments can be made at the school accounts office or via the parent portal.
            For queries contact accounts@sarbajanin.edu.in or call +91-40-12345678.
            This is a system-generated document and is valid without a physical signature.
          </div>
        </div>

        {/* ════════════════════════════════════════════
            AUTHORISED SIGNATORY
            ════════════════════════════════════════════ */}
        <div style={{ padding: '0 36px 24px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: 160, borderTop: '1px solid #9ca3af', marginBottom: 5, marginLeft: 'auto' }} />
            <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af' }}>
              Authorised Signatory
            </div>
          </div>
        </div>



      </div>{/* /paper */}
    </>
  );
}