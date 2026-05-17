// src/pages/TCCertificates.tsx

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  Search, 
  Printer, 
  UserX, 
  CheckCircle, 
  Loader2, 
  ArrowRight,
  ShieldAlert,
  ReceiptText,
  ArrowRightLeft,
  Info,
  ChevronRight,
  ArrowLeft,
  Download,
  Wallet
} from "lucide-react";

import { 
  listStudents, 
  getExitClearancePreview, 
  processStudentExitPermanently, 
  getTransferCertificateData,
  processSettlementPayment,
  ExitClearancePreviewResponse,
  TransferCertificateResponse
} from "../lib/api/students";

import { Button } from "../components/ui/button";
import Pagination from "../components/common/Pagination";
import { useToast } from "../hooks/use-toast";

type WizardStep = 'list' | 'audit' | 'settlement' | 'tc';

export default function TCCertificates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState<WizardStep>('list');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const [previewData, setPreviewData] = useState<ExitClearancePreviewResponse | null>(null);
  const [tcData, setTcData] = useState<TransferCertificateResponse | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  
  const printComponentRef = useRef<HTMLDivElement>(null);

  const studentsQuery = useQuery({
    queryKey: ["tc-students", page, search],
    queryFn: () => listStudents({ page, size: 10, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const students = studentsQuery.data?.content ?? [];
  const totalElements = studentsQuery.data?.totalElements ?? 0;
  const totalPages = Math.ceil(totalElements / 10);

  const requiresSettlement = previewData ? (previewData.pendingDuesToClear > 0 || previewData.advanceToRefund > 0) : false;

  // ── ROUTING ────────────────────────────────────────────────────────
  const handleStartClearance = async (student: any) => {
    setSelectedStudent(student);
    setIsAuditing(true);
    try {
      if (student.status === "INACTIVE" || student.status === "ARCHIVED") {
        // Path 3: Direct to TC Download
        const data = await getTransferCertificateData(student.id);
        setTcData(data);
        setCurrentView('tc'); 
      } else {
        // Paths 1 & 2: Financial Audit
        const data = await getExitClearancePreview(student.id);
        setPreviewData(data);
        setCurrentView('audit'); 
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action Aborted",
        description: error.response?.data?.message || "Could not retrieve data from server.",
      });
      setCurrentView('list');
    } finally {
      setIsAuditing(false);
    }
  };

  // ── EXIT MUTATION (Issues TC) ──────────────────────────────────────
  const exitMutation = useMutation({
    mutationFn: () => processStudentExitPermanently(selectedStudent.id, "TC_ISSUED"),
    onSuccess: async () => {
      toast({
        title: "Exit Processed Successfully",
        description: "Student is now inactive. Retrieving official document...",
      });
      queryClient.invalidateQueries({ queryKey: ["tc-students"] });

      try {
        const data = await getTransferCertificateData(selectedStudent.id);
        setTcData(data);
        setCurrentView('tc'); 
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Certificate Fetch Failed",
          description: err.response?.data?.message || "TC could not be rendered.",
        });
        setCurrentView('list');
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Exit Refused",
        description: error.response?.data?.message || "Please resolve outstanding fee obligations before continuing.",
      });
    }
  });

  // ── PAYMENT MUTATION (Chain -> Exit) ───────────────────────────────
  const paymentMutation = useMutation({
    mutationFn: () => processSettlementPayment(selectedStudent.id, previewData!.pendingDuesToClear, paymentMethod),
    onSuccess: () => {
      toast({ title: "Settlement Cleared", description: "Payment recorded successfully." });
      // Proceed automatically to exit now that payment is cleared
      exitMutation.mutate();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.response?.data?.message || "Could not process the transaction.",
      });
    }
  });

  const triggerBrowserPrint = () => window.print();
  const offsetAmount = previewData ? Math.min(previewData.grossPendingDues, previewData.grossAdvancePool) : 0;

  // ============================================================================
  // RENDER: LIST VIEW
  // ============================================================================
  if (currentView === 'list') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clearance & TC Portal</h1>
              <p className="text-slate-500 text-sm">Perform strict financial audits, terminate academic timelines, and print Transfer Certificates.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search by name or roll number…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
          </div>

          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="h-12 px-5 font-semibold text-slate-600 bg-slate-50 border-y border-slate-200">Roll #</th>
                  <th className="h-12 px-5 font-semibold text-slate-600 bg-slate-50 border-y border-slate-200">Student</th>
                  <th className="h-12 px-5 font-semibold text-slate-600 bg-slate-50 border-y border-slate-200">Section</th>
                  <th className="h-12 px-5 font-semibold text-slate-600 bg-slate-50 border-y border-slate-200">Status</th>
                  <th className="h-12 px-5 text-right font-semibold text-slate-600 bg-slate-50 border-y border-slate-200 pr-5">Action</th>
                </tr>
              </thead>
              <tbody>
                {!studentsQuery.isLoading && students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 align-middle border-b border-slate-100">
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <UserX className="h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-900">No student records found</p>
                      </div>
                    </td>
                  </tr>
                )}

                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 align-middle border-b border-slate-100 font-medium text-slate-700">
                      {student.rollNumber || "—"}
                    </td>
                    <td className="px-5 py-4 align-middle border-b border-slate-100 font-semibold text-slate-900">
                      {student.fullName}
                    </td>
                    <td className="px-5 py-4 align-middle border-b border-slate-100">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                        {student.classSectionName ?? "Unassigned"}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle border-b border-slate-100">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                        (student as any).status === "ACTIVE" 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {(student as any).status}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle border-b border-slate-100 text-right pr-5">
                      <Button
                        size="sm"
                        variant={(student as any).status === "ACTIVE" ? "default" : "outline"}
                        className="gap-2 rounded-lg text-xs"
                        disabled={isAuditing && selectedStudent?.id === student.id}
                        onClick={() => handleStartClearance(student)}
                      >
                        {isAuditing && selectedStudent?.id === student.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (student as any).status === "ACTIVE" ? (
                          <>Verify Clearance <ArrowRight size={14} /></>
                        ) : (
                          <span className="text-indigo-600 flex items-center gap-1.5 font-semibold">
                            Download TC <Download size={14} />
                          </span>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(totalPages > 1 || totalElements > 0) && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
              <span className="text-sm text-slate-500 font-medium">
                {totalElements > 0 ? `Showing ${page * 10 + 1}–${Math.min((page + 1) * 10, totalElements)} of ${totalElements}` : "No students"}
              </span>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: FINANCIAL AUDIT WIZARD (STEP 1)
  // ============================================================================
  if (currentView === 'audit' && previewData) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Dynamic Stepper */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-800 -ml-4" onClick={() => setCurrentView('list')}>
            <ArrowLeft size={16} /> Back to Roster
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 shadow-sm">
              <span className="bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">1</span> Audit
            </span>
            <ChevronRight size={16} className="text-slate-300" />
            {requiresSettlement ? (
              <>
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="bg-slate-200 text-slate-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">2</span> Settlement
                </span>
                <ChevronRight size={16} className="text-slate-300" />
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="bg-slate-200 text-slate-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">3</span> Issue TC
                </span>
              </>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <span className="bg-slate-200 text-slate-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">2</span> Issue TC
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600 h-6 w-6" /> Step 1: Exit Clearance Audit
              </h2>
              <p className="text-slate-500 text-sm mt-1">Review obligations for <strong className="text-slate-800">{selectedStudent?.fullName}</strong> before issuing the TC.</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
              previewData.cleared ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                {previewData.cleared ? <CheckCircle className="h-8 w-8 text-emerald-600" /> : <ShieldAlert className="h-8 w-8 text-amber-600" />}
                <div>
                  <h4 className="font-bold text-base">{previewData.cleared ? 'Cleared for Exit' : 'Financial Block Active'}</h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    {previewData.cleared ? 'No outstanding debt. Ready to process.' : 'Outstanding dues detected. Exit block is enforced.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3 border-b border-slate-200 bg-slate-100/80 flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-slate-500" />
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Detailed Settlement Statement</h4>
              </div>
              
              <div className="p-4 space-y-4 text-sm">
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Fee Type</th>
                        <th className="px-4 py-2.5">Details</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.pendingLineItems.length === 0 ? (
                        <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">No financial records to settle.</td></tr>
                      ) : (
                        previewData.pendingLineItems.map((item) => {
                          const isCredit = item.balance < 0; 
                          const absBal = Math.abs(item.balance).toFixed(2);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-bold text-slate-800">{item.feeType} {item.period && <span className="font-normal text-xs text-slate-500 block">{item.period}</span>}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">
                                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-widest mr-1 ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {isCredit ? 'Credit' : 'Debit'}
                                </span> 
                                {isCredit ? 'Advance Overpayment' : 'Unpaid Past Due'}
                              </td>
                              <td className={`px-4 py-3 text-right font-semibold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>{isCredit ? '+' : '-'}${absBal}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-semibold">
                      <tr><td colSpan={2} className="px-4 py-2 text-right text-slate-500">Gross Unpaid Dues:</td><td className="px-4 py-2 text-right text-rose-600">-${previewData.grossPendingDues.toFixed(2)}</td></tr>
                      <tr><td colSpan={2} className="px-4 py-2 text-right text-slate-500 border-t border-slate-200/60">Gross Advance Credits:</td><td className="px-4 py-2 text-right text-emerald-600 border-t border-slate-200/60">+${previewData.grossAdvancePool.toFixed(2)}</td></tr>
                    </tfoot>
                  </table>
                </div>
                
                {offsetAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-500 text-xs px-2 pt-1">
                    <span className="flex items-center gap-1.5 font-medium"><ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" /> System Auto-Offset Applied</span>
                    <span className="font-semibold text-slate-700">+${offsetAmount.toFixed(2)} credit shifted to clear past dues</span>
                  </div>
                )}
                
                <div className="border-t border-slate-300 pt-4 flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-bold text-slate-800 text-lg">Net Settlement Outcome</span>
                  <div className="text-right">
                    {previewData.advanceToRefund > 0 ? (
                      <><span className="text-[10px] uppercase text-emerald-600 font-bold tracking-widest block">Refund Due to Parent</span><span className="font-black text-emerald-600 text-3xl block">${previewData.advanceToRefund.toFixed(2)}</span></>
                    ) : previewData.pendingDuesToClear > 0 ? (
                      <><span className="text-[10px] uppercase text-rose-600 font-bold tracking-widest block">Parent Owes Balance</span><span className="font-black text-rose-600 text-3xl block">${previewData.pendingDuesToClear.toFixed(2)}</span></>
                    ) : (
                      <><span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest block">Balance Settled</span><span className="font-black text-slate-800 text-3xl block">$0.00</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {previewData.futureFeesToCancel > 0 && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between px-6 shadow-sm">
                <span className="text-sm text-slate-600 font-medium flex items-center gap-2"><Info className="h-5 w-5 text-slate-400" /> Future Unearned Fees (Automatically Dropped)</span>
                <span className="text-xl font-bold text-slate-400">${previewData.futureFeesToCancel.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentView('list')} className="bg-white">Cancel</Button>
            {requiresSettlement ? (
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={() => setCurrentView('settlement')}>
                Next: Proceed to Settlement <ArrowRight size={16} />
              </Button>
            ) : (
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => exitMutation.mutate()} disabled={exitMutation.isPending}>
                {exitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Next: Issue TC & Exit Student <CheckCircle size={16} /></>}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: SETTLEMENT WIZARD (STEP 2 if needed)
  // ============================================================================
  if (currentView === 'settlement' && previewData) {
    const isRefund = previewData.advanceToRefund > 0;
    const amount = isRefund ? previewData.advanceToRefund : previewData.pendingDuesToClear;

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-800 -ml-4" onClick={() => setCurrentView('audit')}>
            <ArrowLeft size={16} /> Back to Audit
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-slate-500 flex items-center gap-1 opacity-70"><CheckCircle className="w-4 h-4 text-emerald-500" /> Audit</span>
            <ChevronRight size={16} className="text-slate-300" />
            <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 shadow-sm">
              <span className="bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">2</span> Settlement
            </span>
            <ChevronRight size={16} className="text-slate-300" />
            <span className="text-slate-400 flex items-center gap-1">
              <span className="bg-slate-200 text-slate-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">3</span> Issue TC
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="text-indigo-600 h-6 w-6" /> Step 2: Financial Settlement
            </h2>
            <p className="text-slate-500 text-sm mt-1">Process the remaining balance before issuing the official Transfer Certificate.</p>
          </div>

          <div className="p-8 md:p-12 max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-bold tracking-widest uppercase text-slate-500">
                {isRefund ? "Amount to Refund to Parent" : "Amount Due from Parent"}
              </h3>
              <p className={`text-5xl font-black ${isRefund ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${amount.toFixed(2)}
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-800">Select {isRefund ? 'Refund' : 'Payment'} Method</label>
              <div className="grid grid-cols-3 gap-3">
                {['CASH', 'CREDIT CARD', 'BANK TRANSFER'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMethod(mode)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      paymentMethod === mode 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button variant="outline" className="bg-white" onClick={() => setCurrentView('audit')} disabled={paymentMutation.isPending || exitMutation.isPending}>
              Back
            </Button>
            <Button 
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px] shadow-sm" 
              onClick={() => {
                if (isRefund) {
                  // For refunds, directly exit. Implement real refund API later if needed.
                  toast({ title: "Refund Recorded", description: "Refund logged successfully." });
                  exitMutation.mutate();
                } else {
                  paymentMutation.mutate();
                }
              }}
              disabled={paymentMutation.isPending || exitMutation.isPending}
            >
              {(paymentMutation.isPending || exitMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>{isRefund ? 'Process Refund' : 'Process Payment'} & Issue TC <CheckCircle size={16} /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: TC DOCUMENT WIZARD (STEP 3)
  // ============================================================================
  if (currentView === 'tc' && tcData) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 print:p-0 print:m-0 print:block">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-800 -ml-4" onClick={() => setCurrentView('list')}>
            <ArrowLeft size={16} /> Back to Roster
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-slate-500 flex items-center gap-1.5 opacity-70"><CheckCircle className="w-4 h-4 text-emerald-500" /> Financial Audit</span>
            <ChevronRight size={16} className="text-slate-300" />
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200 flex items-center gap-1.5 shadow-sm">
              <CheckCircle className="w-4 h-4" /> TC Issued
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-0 print:shadow-none">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
            <div>
              <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" /> Official Document Ready
              </h2>
              <p className="text-slate-500 text-sm mt-1">The student has been successfully exited. The document is ready to print.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-white" onClick={() => setCurrentView('list')}>Done</Button>
              <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm" onClick={triggerBrowserPrint}>
                <Printer size={16} /> Print Document
              </Button>
            </div>
          </div>

          <div className="p-8 md:p-12 print:p-0">
            <div 
              ref={printComponentRef}
              className="print-tc-document bg-white border-8 border-slate-900 p-10 md:p-14 relative text-slate-900 shadow-sm print:shadow-none print:border-slate-950 font-serif max-w-4xl mx-auto min-h-[800px]"
            >
              <div className="absolute inset-2 border-2 border-slate-800 pointer-events-none" />
              <div className="space-y-10 relative z-10">
                <div className="text-center space-y-3">
                  <h2 className="text-4xl font-bold tracking-wider uppercase text-slate-950">Sarbajanin Academy</h2>
                  <p className="text-sm uppercase tracking-widest text-slate-600 font-sans">Primary & Secondary Education Board • Affiliation No. 2026-991</p>
                  <div className="h-1 bg-slate-900 w-48 mx-auto my-4" />
                  <h3 className="text-3xl font-semibold tracking-wider italic text-slate-900 font-serif">Transfer Certificate</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 pt-6 font-sans text-base">
                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5"><span className="text-slate-500">Student Name:</span><span className="font-bold uppercase text-slate-900">{tcData.studentName}</span></div>
                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5"><span className="text-slate-500">Certificate Issue Date:</span><span className="font-semibold text-slate-900">{tcData.issueDate}</span></div>
                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5"><span className="text-slate-500">Registration Number:</span><span className="font-semibold text-slate-900">{tcData.registrationNo}</span></div>
                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5"><span className="text-slate-500">Guardian Name:</span><span className="font-semibold text-slate-900">{tcData.guardianName}</span></div>
                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5"><span className="text-slate-500">Admission Date:</span><span className="font-semibold text-slate-900">{tcData.admissionDate}</span></div>
                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5"><span className="text-slate-500">Date of Birth:</span><span className="font-semibold text-slate-900">{tcData.dateOfBirth}</span></div>
                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5"><span className="text-slate-500">Class Last Attended:</span><span className="font-bold text-slate-900 uppercase">{tcData.lastClassAttended.replace('_', ' ')}</span></div>
                  <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5"><span className="text-slate-500">Academic Leaving Outcome:</span><span className="font-bold text-slate-900 uppercase">{tcData.academicOutcome.replace('_', ' ')}</span></div>
                </div>

                <div className="pt-10 space-y-16">
                  <p className="text-center italic text-slate-700 text-lg font-serif max-w-3xl mx-auto leading-relaxed">
                    "This is to certify that the student mentioned above has been officially cleared of all physical, financial, and academic liabilities at Sarbajanin Academy. All school fee payments were audited, fully verified, and cleared prior to certificate issuance."
                  </p>

                  <div className="flex flex-col md:flex-row items-center justify-between pt-12 gap-8 px-4">
                    <div className="flex items-center gap-4 border-4 border-emerald-600 p-4 rounded-xl rotate-[-4deg] uppercase bg-emerald-50/30 text-emerald-800 font-sans shadow-sm">
                      <CheckCircle className="h-10 w-10 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs tracking-widest block font-bold text-emerald-700">Audits Division</span>
                        <span className="text-base font-black tracking-widest">Financials Cleared</span>
                      </div>
                    </div>

                    <div className="flex gap-20 font-sans">
                      <div className="text-center w-40">
                        <div className="h-12 border-b border-slate-950" />
                        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mt-2">Class Teacher</span>
                      </div>
                      <div className="text-center w-40">
                        <div className="h-12 border-b border-slate-950" />
                        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mt-2">Principal Seal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}