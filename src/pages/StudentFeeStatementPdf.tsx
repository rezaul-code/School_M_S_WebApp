// src/pages/StudentFeeStatementPdf.tsx
//
// Route:  /reports/student-statement/pdf?studentId=...&academicYearId=...
//
// This is a dedicated print-only page. On mount it loads the statement
// and immediately triggers window.print(). The page has zero app chrome —
// just the A4-formatted document.
//
// Register in App.tsx inside the protected routes:
//   <Route path="/reports/student-statement/pdf" element={<StudentFeeStatementPdf />} />

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery }        from '@tanstack/react-query';
import { Loader2 }         from 'lucide-react';

import { getStudentFeeStatement, type StudentFeeStatementResponse, type StatementLineItem } from '@/lib/api/studentFeeStatement';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase();

const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  PAID:    { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  PARTIAL: { bg: '#dbeafe', text: '#1e3a8a', dot: '#2563eb' },
  PENDING: { bg: '#fef9c3', text: '#854d0e', dot: '#d97706' },
  OVERDUE: { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  WAIVED:  { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
};

const FEE_TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  TUITION:   { bg: '#ede9fe', text: '#4c1d95' },
  TRANSPORT: { bg: '#dbeafe', text: '#1e3a8a' },
  ACTIVITY:  { bg: '#fef3c7', text: '#78350f' },
  EXAM:      { bg: '#fce7f3', text: '#831843' },
  ADMISSION: { bg: '#ccfbf1', text: '#134e4a' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentFeeStatementPdf() {
  const [params] = useSearchParams();
  const studentId    = params.get('studentId') ?? '';
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
      // Small delay so the DOM finishes painting
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [stmt]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, fontFamily: 'sans-serif', color: '#64748b' }}>
        <Loader2 style={{ width: 28, height: 28, animation: 'spin 1s linear infinite' }} />
        Preparing statement…
      </div>
    );
  }

  if (isError || !stmt) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#ef4444' }}>
        Could not load statement. Please close this tab and try again.
      </div>
    );
  }

  // Separate overdue rows for visual highlighting
  const overdueIds = new Set(stmt.lineItems.filter(r => r.status === 'OVERDUE').map(r => r.ledgerId));

  return (
    <>
      {/* Print CSS — scoped to this page only */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @page { size: A4 portrait; margin: 0; }
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
          .paper { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Screen-only action bar */}
      <div className="no-print" style={{ background: '#1e293b', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#94a3b8', fontSize: 13, fontFamily: 'sans-serif' }}>
          Preview — {stmt.studentName} · {stmt.academicYearName}
        </span>
        <button
          onClick={() => window.print()}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}
        >
          Print / Save as PDF
        </button>
      </div>

      {/* A4 paper */}
      <div className="paper" style={{
        width: 794, minHeight: 1123, margin: '24px auto', background: '#fff',
        boxShadow: '0 4px 32px rgba(0,0,0,0.12)', borderRadius: 4, overflow: 'hidden',
      }}>

        {/* ── Header band ──────────────────────────────────────────────── */}
        <div style={{ background: '#1a2236', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: '#f59e0b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#fff' }}>H</div>
            <div>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '0.06em' }}>HATSYNK</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Edutech</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>Student Fee Statement</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 3 }}>
              Ref: {stmt.referenceNo} · Generated: {fmtDate(stmt.generatedOn)}
            </div>
          </div>
        </div>

        {/* ── Student + statement info ──────────────────────────────────── */}
        <div style={{ padding: '18px 32px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
          {/* Left: student */}
          <div style={{ paddingBottom: 18 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Student details</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
              {stmt.studentName}
              <span style={{ marginLeft: 8, fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                {stmt.studentStatus}
              </span>
            </div>
            <InfoRow label="Roll no."       value={stmt.rollNumber ?? '—'} />
            <InfoRow label="Class / section" value={stmt.classSectionName} />
            <InfoRow label="Reg. no."       value={stmt.registrationNo} />
            <InfoRow label="Parent"         value={stmt.parentName ?? '—'} />
            <InfoRow label="Contact"        value={stmt.parentContact ?? '—'} />
          </div>

          {/* Right: statement meta */}
          <div style={{ paddingLeft: 24, paddingBottom: 18, borderLeft: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Statement details</div>
            <div style={{ height: 17 + 6 }} /> {/* align with student name row */}
            <InfoRow label="Academic year"  value={stmt.academicYearName} />
            <InfoRow label="Period"         value={stmt.statementPeriod} />
            <InfoRow label="Generated by"  value={stmt.generatedBy} />
            <InfoRow label="Reference"     value={stmt.referenceNo} />
          </div>
        </div>

        {/* ── Financial summary strip ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '2px solid #1a2236' }}>
          {[
            { label: 'Gross amount', value: INR(stmt.grossAmount),   color: '#1a2236' },
            { label: 'Total paid',   value: INR(stmt.totalPaid),     color: '#166534' },
            { label: 'Partial',      value: INR(stmt.totalPartial),  color: '#1e40af' },
            { label: 'Pending',      value: INR(stmt.totalPending),  color: '#92400e' },
            { label: 'Overdue',      value: INR(stmt.totalOverdue),  color: '#991b1b' },
          ].map((c, i) => (
            <div key={i} style={{ padding: '12px 16px', textAlign: 'center', borderRight: i < 4 ? '1px solid #e5e7eb' : 'none' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* ── Line items table ──────────────────────────────────────────── */}
        <div style={{ padding: '0 32px 24px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', padding: '14px 0 8px' }}>
            Fee ledger — all line items
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 24 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 76 }} />
              <col style={{ width: 72 }} />
              <col style={{ width: 68 }} />
              <col style={{ width: 64 }} />
              <col style={{ width: 68 }} />
              <col style={{ width: 68 }} />
              <col style={{ width: 64 }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#1a2236' }}>
                {['#', 'Fee type', 'Period', 'Due date', 'Net due', 'Discount', 'Paid', 'Balance', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 8px', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', textAlign: h === '#' || h === 'Fee type' || h === 'Period' || h === 'Due date' || h === 'Status' ? 'left' : 'right' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stmt.lineItems.map((row: StatementLineItem, idx: number) => {
                const isOverdue = overdueIds.has(row.ledgerId);
                const ftColor   = FEE_TYPE_COLOR[row.feeType] ?? { bg: '#f1f5f9', text: '#374151' };
                const stColor   = STATUS_COLOR[row.status]    ?? STATUS_COLOR.PENDING;
                return (
                  <tr key={row.ledgerId} style={{ background: isOverdue ? '#fff8f8' : idx % 2 === 1 ? '#fafafa' : '#fff', borderBottom: '0.5px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 8px', color: '#9ca3af' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 8px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, background: ftColor.bg, color: ftColor.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {row.feeTypeLabel.replace(' Fee', '')}
                      </span>
                    </td>
                    <td style={{ padding: '8px 8px', color: '#6b7280', fontSize: 10 }}>{row.period ?? '—'}</td>
                    <td style={{ padding: '8px 8px', color: isOverdue ? '#991b1b' : '#374151', fontWeight: isOverdue ? 600 : 400, fontSize: 10 }}>
                      {fmtDate(row.dueDate)}
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 500, color: '#1f2937' }}>{INR(row.netDue)}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', color: row.discount > 0 ? '#166534' : '#d1d5db' }}>
                      {row.discount > 0 ? `–${INR(row.discount)}` : '—'}
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 600, color: '#166534' }}>{INR(row.amountPaid)}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 600, color: isOverdue ? '#991b1b' : row.balance > 0 ? '#92400e' : '#9ca3af' }}>
                      {INR(row.balance)}
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: stColor.bg, color: stColor.text }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: stColor.dot, display: 'inline-block', flexShrink: 0 }} />
                        {row.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {stmt.totalDiscount > 0 && (
                <tr style={{ borderTop: '1px solid #d1d5db' }}>
                  <td colSpan={4} style={{ padding: '8px 8px', fontSize: 10, color: '#6b7280' }}>Discount applied</td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', color: '#6b7280' }}>{INR(stmt.netAmount)}</td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', color: '#166534', fontWeight: 600 }}>–{INR(stmt.totalDiscount)}</td>
                  <td colSpan={3} />
                </tr>
              )}
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #1a2236' }}>
                <td colSpan={4} style={{ padding: '10px 8px', fontWeight: 700, fontSize: 11, color: '#1a2236', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total — {stmt.academicYearName}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#1a2236' }}>{INR(stmt.netAmount)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                  {stmt.totalDiscount > 0 ? `–${INR(stmt.totalDiscount)}` : '—'}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#166534' }}>{INR(stmt.totalPaid)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: stmt.balanceDue > 0 ? '#991b1b' : '#9ca3af' }}>
                  {INR(stmt.balanceDue)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
            {Object.entries(STATUS_COLOR).filter(([k]) => k !== 'TRANSFER_CREDIT').map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.dot }} />
                {k.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* ── Notes ────────────────────────────────────────────────────── */}
        <div style={{ margin: '0 32px', borderTop: '1px solid #e5e7eb', padding: '12px 0' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 5 }}>Notes</div>
          <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6 }}>
            Payments can be made at the school accounts office or via the parent portal. For queries regarding this statement, contact the accounts department at accounts@hatsynk.edu.in or call +91-40-12345678. This is a system-generated document and is valid without a physical signature.
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '12px 32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ fontSize: 9, color: '#9ca3af', lineHeight: 1.7 }}>
            <div>Hatsynk Model School · Survey No. 42, Gachibowli, Hyderabad – 500032</div>
            <div>accounts@hatsynk.edu.in · +91-40-12345678</div>
            <div>Ref: {stmt.referenceNo} · Page 1 of 1</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: 120, borderTop: '1px solid #9ca3af', marginBottom: 4, marginLeft: 'auto' }} />
            <div style={{ fontSize: 8, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Authorised signatory</div>
          </div>
        </div>

      </div>
    </>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
      <span style={{ fontSize: 10, color: '#9ca3af', minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 500, color: '#1f2937' }}>{value}</span>
    </div>
  );
}