// src/pages/ResultRuleSetup.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight, CheckCircle2, Lock, Plus, Trash2,
  Save, AlertCircle, Copy, ArrowLeft, Shield,
  BookOpen, FlaskConical, ClipboardList, Info
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";

import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { getAllGradingSchemes } from "@/lib/api/gradingSchemes";
import { getAllExamTypes, getSavedExamSchedule, SavedSubjectData } from "@/lib/api/exams";
import { api } from "@/lib/api/client";
import {
  getResultRule,
  getRulesByYear,
  createResultRule,
  addRuleComponent,
  removeRuleComponent,
  deleteResultRule,
  CreateResultRuleRequest,
  AddRuleComponentRequest,
  getClassSubjects,
  bulkSaveRuleSubjects,
  BulkSaveSubjectsRequest,
  saveConsolidatedSubjects,
  SaveConsolidatedSubjectsRequest,
} from "@/lib/api/resultRules";

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Core Strategy",  icon: BookOpen },
  { num: 2, label: "Exam Formula",   icon: FlaskConical },
  { num: 3, label: "Subject Marks",  icon: ClipboardList },
  { num: 4, label: "Review & Lock",  icon: Shield },
];

function StepRail({ current, maxReached }: { current: number; maxReached: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done    = s.num < current;
        const active  = s.num === current;
        const Icon    = s.icon;
        return (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`
                h-10 w-10 rounded-full flex items-center justify-center
                border-2 transition-all duration-300 font-bold text-sm
                ${done   ? "bg-primary border-primary text-primary-foreground" : ""}
                ${active ? "bg-background border-primary text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]" : ""}
                ${!done && !active ? "bg-muted border-border text-muted-foreground" : ""}
              `}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap transition-colors
                ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors duration-500
                ${s.num < current ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: "wizardFadeIn 0.22s ease both" }}>
      {children}
      <style>{`
        @keyframes wizardFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

interface ResultRuleSetupProps {
  initialClassId?: string | null;
  onClose: () => void;
}

const STATUS_PRIORITY: Record<string, number> = {
  COMPLETED: 5, EVALUATION: 4, ONGOING: 3, SCHEDULED: 2, DRAFT: 1, CANCELLED: 0,
};

export default function ResultRuleSetup({ initialClassId, onClose }: ResultRuleSetupProps) {
  const queryClient = useQueryClient();
  const { data: activeYear } = useActiveAcademicYear();

  const [step, setStep]           = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || "");
  const [ruleId, setRuleId]       = useState<number | null>(null);

  const [createForm, setCreateForm] = useState<Partial<CreateResultRuleRequest>>({
    applyGraceMarks: false,
    strategyType: "WEIGHTED_AVERAGE",
  });

  const [compForm, setCompForm] = useState<AddRuleComponentRequest>({
    examTypeId: 0, weightagePercent: 0, mandatoryPass: false,
  });

  // WEIGHTED_AVERAGE: componentId → classSubjectId → { maxMarks, passMarks }
  const [subjectConfigs, setSubjectConfigs] = useState<Record<number, Record<number, { maxMarks: number | null; passMarks: number | null }>>>({});

  const [consolidatedPassMarks, setConsolidatedPassMarks] = useState<Record<number, number | null>>({});

  const [activeTab, setActiveTab] = useState<number | null>(null);

  // ── Master data ──────────────────────────────────────────────────────────

  const { data: classes = [] } = useQuery({
    queryKey: ["classLevels"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/options/class-levels");
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch { return []; }
    },
  });

  const { data: schemes = [] } = useQuery({
    queryKey: ["gradingSchemes"], queryFn: getAllGradingSchemes,
  });

  const { data: examTypes = [] } = useQuery({
    queryKey: ["examTypes"], queryFn: getAllExamTypes,
  });

  const { data: previousRules = [] } = useQuery({
    queryKey: ["previousRules", activeYear?.id],
    queryFn: () => getRulesByYear(activeYear!.id - 1),
    enabled: !!activeYear?.id,
  });

  const { data: currentRule } = useQuery({
    queryKey: ["resultRule", activeYear?.id, selectedClassId],
    queryFn: () => getResultRule(activeYear!.id, parseInt(selectedClassId)),
    enabled: !!activeYear?.id && !!selectedClassId,
  });

  const { data: classSubjects = [] } = useQuery({
    queryKey: ["classSubjects", selectedClassId],
    queryFn: () => getClassSubjects(parseInt(selectedClassId)),
    enabled: !!selectedClassId,
  });

  const { data: examSchedules = [] } = useQuery({
    queryKey: ["examSchedules", activeYear?.id, selectedClassId],
    queryFn: async () => {
      const response = await api.get<{ data: any[] }>(
        `/api/v1/exams/applicable?academicYearId=${activeYear!.id}&classLevelId=${selectedClassId}`
      );
      const exams: any[] = response.data.data;
      const bestByType = new Map<number, any>();
      for (const exam of exams) {
        const existing         = bestByType.get(exam.examTypeId);
        const currentPriority  = STATUS_PRIORITY[exam.status] ?? 0;
        const existingPriority = existing ? (STATUS_PRIORITY[existing.status] ?? 0) : -1;
        if (currentPriority > existingPriority) bestByType.set(exam.examTypeId, exam);
      }
      const usableStatuses = new Set(["SCHEDULED", "ONGOING", "EVALUATION", "COMPLETED"]);
      const results = await Promise.all(
        Array.from(bestByType.values())
          .filter(exam => usableStatuses.has(exam.status))
          .map(async (exam) => {
            try {
              const schedule = await getSavedExamSchedule(exam.id);
              return { examTypeId: exam.examTypeId, examTypeName: exam.examTypeName, status: exam.status, subjects: schedule.subjects };
            } catch { return null; }
          })
      );
      return results.filter(Boolean) as { examTypeId: number; examTypeName: string; status: string; subjects: SavedSubjectData[] }[];
    },
    enabled: !!activeYear?.id && !!selectedClassId,
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getScheduledMaxMarks = (examTypeId: number, classSubjectId: number): number | null => {
    const schedule = examSchedules?.find(s => s.examTypeId === examTypeId);
    if (!schedule) return null;
    const subjectData = schedule.subjects.find((s: any) => s.classSubjectId === classSubjectId);
    if (!subjectData) return null;
    const total = subjectData.components?.reduce((sum: number, c: any) => sum + (c.maxMarks ?? 0), 0) ?? 0;
    return total > 0 ? total : null;
  };

  const getScheduledPassMarks = (examTypeId: number, classSubjectId: number): number | null => {
    const schedule = examSchedules?.find(s => s.examTypeId === examTypeId);
    if (!schedule) return null;
    const subjectData = schedule.subjects.find((s: any) => s.classSubjectId === classSubjectId);
    if (!subjectData) return null;
    const total = subjectData.components?.reduce((sum: number, c: any) => sum + (c.passMarks ?? 0), 0) ?? 0;
    return total > 0 ? total : null;
  };

  const getConsolidatedMaxMarks = (classSubjectId: number): number => {
    return currentRule?.components?.reduce((sum: number, comp: any) => {
      return sum + (getScheduledMaxMarks(comp.examTypeId, classSubjectId) ?? 0);
    }, 0) ?? 0;
  };

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (currentRule?.id) setRuleId(currentRule.id);
  }, [currentRule?.id]);

  useEffect(() => {
    if (currentRule?.components?.length && !activeTab) {
      setActiveTab(currentRule.components[0].id);
    }
  }, [currentRule?.components, activeTab]);

  useEffect(() => {
    if (!currentRule) return;
    if (currentRule.isLocked) {
      setStep(4); setMaxReached(4); return;
    }
    const isSummation = currentRule.strategyType === "SUMMATION";
    if (isSummation) {
      const hasConsolidated = currentRule.consolidatedSubjectRules?.length > 0;
      if (hasConsolidated) setMaxReached(prev => Math.max(prev, 3));
    } else {
      const allComponentsMapped = currentRule.components?.every(
        (c: any) => c.subjectRules && c.subjectRules.length > 0
      );
      if (allComponentsMapped) setMaxReached(prev => Math.max(prev, 3));
    }
    if (currentRule.components?.length) setMaxReached(prev => Math.max(prev, 2));
  }, [currentRule?.id, currentRule?.components, currentRule?.consolidatedSubjectRules]);

  useEffect(() => {
    if (!currentRule?.components?.length || !classSubjects.length) return;
    if (currentRule.strategyType === "SUMMATION") return;

    setSubjectConfigs(prev => {
      const newConfigs: Record<number, Record<number, { maxMarks: number | null; passMarks: number | null }>> = {};
      currentRule.components.forEach((comp: any) => {
        newConfigs[comp.id] = {};
        classSubjects.forEach((subject: any) => {
          const existing     = comp.subjectRules?.find((sr: any) => sr.classSubjectId === subject.id);
          
          const savedMax     = existing?.targetMaxMarks ?? null;
          const savedPass    = existing?.minPassMarks   ?? null;
          
          const scheduledMax  = getScheduledMaxMarks(comp.examTypeId, subject.id);
          const scheduledPass = getScheduledPassMarks(comp.examTypeId, subject.id);
          const prevPassEdit  = prev[comp.id]?.[subject.id]?.passMarks;
          newConfigs[comp.id][subject.id] = {
            maxMarks:  scheduledMax ?? savedMax,
            passMarks: prevPassEdit ?? scheduledPass ?? savedPass,
          };
        });
      });
      return newConfigs;
    });
  }, [classSubjects, currentRule?.components, examSchedules]);

  useEffect(() => {
    if (!currentRule || currentRule.strategyType !== "SUMMATION") return;
    if (!currentRule.consolidatedSubjectRules?.length) return;

    setConsolidatedPassMarks(prev => {
      const next: Record<number, number | null> = { ...prev };
      currentRule.consolidatedSubjectRules.forEach((sr: any) => {
        if (prev[sr.classSubjectId] === undefined) {
          next[sr.classSubjectId] = sr.consolidatedPassMarks;
        }
      });
      return next;
    });
  }, [currentRule?.consolidatedSubjectRules]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const goTo = (n: number) => {
    setStep(n);
    setMaxReached(prev => Math.max(prev, n));
  };

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: createResultRule,
    onSuccess: (rule) => {
      setRuleId(rule.id);
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Configuration initialized.");
      goTo(2);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create rule."),
  });

  const cloneMutation = useMutation({
    mutationFn: createResultRule,
    onSuccess: async (newRule) => {
      const prevRule = previousRules.find((r: any) => r.classLevelId === parseInt(selectedClassId));
      if (prevRule) {
        for (const comp of prevRule.components) {
          await addRuleComponent(newRule.id, {
            examTypeId: comp.examTypeId,
            weightagePercent: comp.weightagePercent,
            mandatoryPass: comp.mandatoryPass,
          });
        }
      }
      setRuleId(newRule.id);
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Cloned from previous year!");
      goTo(2);
    },
  });

  const addComponentMutation = useMutation({
    mutationFn: (data: AddRuleComponentRequest) => addRuleComponent(ruleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Exam added.");
      setCompForm({ examTypeId: 0, weightagePercent: 0, mandatoryPass: false });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add exam."),
  });

  const deleteComponentMutation = useMutation({
    mutationFn: removeRuleComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Exam removed.");
    },
  });

  const saveSubjectsMutation = useMutation({
    mutationFn: (data: BulkSaveSubjectsRequest) => bulkSaveRuleSubjects(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Subject marks saved.");
      goTo(4);
    },
  });

  const saveConsolidatedMutation = useMutation({
    mutationFn: (data: SaveConsolidatedSubjectsRequest) =>
      saveConsolidatedSubjects(ruleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Consolidated subject marks saved.");
      goTo(4);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to save consolidated marks."),
  });

  const lockMutation = useMutation({
    mutationFn: async () => { await api.patch(`/api/v1/result-rules/${ruleId}/lock`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Configuration locked and published!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to lock rule."),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteResultRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      setRuleId(null);
      setSelectedClassId("");
      goTo(1);
      toast.success("Configuration deleted.");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Cannot delete."),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateNew = () => {
    if (!selectedClassId || !createForm.gradingSchemeId)
      return toast.error("Please select a class and grading scheme.");
    createMutation.mutate({
      name: `${activeYear?.name} - Class Rule`,
      academicYearId: activeYear!.id,
      classLevelId: parseInt(selectedClassId),
      strategyType: createForm.strategyType || "WEIGHTED_AVERAGE",
      gradingSchemeId: createForm.gradingSchemeId,
      applyGraceMarks: createForm.applyGraceMarks || false,
    });
  };

  const handleClone = () => {
    const prevRule = previousRules.find((r: any) => r.classLevelId === parseInt(selectedClassId));
    if (!prevRule) return toast.error("No previous year config found.");
    cloneMutation.mutate({
      name: `${activeYear?.name} - Cloned Rule`,
      academicYearId: activeYear!.id,
      classLevelId: parseInt(selectedClassId),
      strategyType: prevRule.strategyType,
      gradingSchemeId: prevRule.gradingSchemeId,
      applyGraceMarks: prevRule.applyGraceMarks,
    });
  };

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    const isSummation = currentRule?.strategyType === "SUMMATION";
    if (!compForm.examTypeId) return toast.error("Select an exam.");
    if (currentRule?.components.some((c: any) => c.examTypeId === compForm.examTypeId))
      return toast.error("Exam already added.");
    if (!isSummation && compForm.weightagePercent <= 0)
      return toast.error("Enter a valid weightage.");
    addComponentMutation.mutate({
      ...compForm,
      weightagePercent: isSummation ? 0 : compForm.weightagePercent,
    });
  };

  const handleSaveSubjects = () => {
    if (!currentRule?.components?.length) return;

    const payload: BulkSaveSubjectsRequest = {
      components: currentRule.components.map((comp: any) => ({
        componentId: comp.id,
        subjects: classSubjects.map((sub: any) => {
          const scheduledMax  = getScheduledMaxMarks(comp.examTypeId, sub.id) ?? 0;
          const scheduledPass = getScheduledPassMarks(comp.examTypeId, sub.id) ?? 0;

          return {
            classSubjectId:        sub.id,
            consolidatedMaxMarks:  scheduledMax,
            consolidatedPassMarks: scheduledPass,
          };
        }),
      })),
    };

    saveSubjectsMutation.mutate(payload);
  };

  const handleSaveConsolidated = () => {
    if (!classSubjects.length) return;
    const payload: SaveConsolidatedSubjectsRequest = {
      subjects: classSubjects.map((sub: any) => ({
        classSubjectId:        sub.id,
        consolidatedMaxMarks:  getConsolidatedMaxMarks(sub.id),
        consolidatedPassMarks: consolidatedPassMarks[sub.id] ?? 0,
      })),
    };
    saveConsolidatedMutation.mutate(payload);
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isSummationMode = currentRule?.strategyType === "SUMMATION";
  const hasPrevRule     = previousRules.some((r: any) => r.classLevelId === parseInt(selectedClassId));
  const weightageOk     = isSummationMode || (currentRule?.totalWeightage === 100);
  const isLocked        = currentRule?.isLocked;

  const mandatoryComponents = currentRule?.components?.filter((c: any) => c.mandatoryPass) ?? [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="md-page max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-300">

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Result Rules Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Define how student results are calculated for each class.
          </p>
        </div>
        <Button variant="outline" onClick={onClose} className="gap-2 shrink-0">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <StepRail current={step} maxReached={maxReached} />

      <div className="md-card border border-border rounded-2xl overflow-hidden shadow-sm bg-card">

        {/* ── STEP 1: Core Strategy ────────────────────────────────────── */}
        {step === 1 && (
          <Slide>
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">Step 1 — Core Strategy</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose the class and define how results will be evaluated.
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Input value={activeYear?.name || "Loading..."} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Class Level</Label>
                    <Select
                      value={selectedClassId}
                      onValueChange={setSelectedClassId}
                      disabled={!!initialClassId}
                    >
                      <SelectTrigger><SelectValue placeholder="Select class..." /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c: any) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.label || c.displayName || c.name || `Class ${c.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedClassId && currentRule && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          Configuration already exists for this class
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isSummationMode ? "Pure Summation" : "Weighted Average"} ·{" "}
                          {currentRule.gradingSchemeName}
                          {isLocked && " · 🔒 Locked"}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => goTo(isLocked ? 4 : 2)} size="sm" className="gap-1.5">
                      {isLocked ? "View" : "Continue"} <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {selectedClassId && !currentRule && (
                  <>
                    {hasPrevRule && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          Previous year config found — clone it to save time.
                        </p>
                        <Button
                          onClick={handleClone}
                          disabled={cloneMutation.isPending}
                          variant="outline" size="sm"
                          className="gap-1.5 border-blue-400 text-blue-700"
                        >
                          <Copy className="h-3.5 w-3.5" /> Clone
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Calculation Strategy</Label>
                        <Select
                          value={createForm.strategyType}
                          onValueChange={(v) => setCreateForm({ ...createForm, strategyType: v as any })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WEIGHTED_AVERAGE">Weighted Percentages</SelectItem>
                            <SelectItem value="SUMMATION">Pure Summation (Raw Marks)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Grading Scheme</Label>
                        <Select
                          onValueChange={(v) => setCreateForm({ ...createForm, gradingSchemeId: parseInt(v) })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select scheme..." /></SelectTrigger>
                          <SelectContent>
                            {schemes.map((s: any) => (
                              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="grace"
                        checked={createForm.applyGraceMarks}
                        onCheckedChange={(c) => setCreateForm({ ...createForm, applyGraceMarks: !!c })}
                      />
                      <Label htmlFor="grace" className="cursor-pointer text-sm">
                        Apply Grace Marks Automatically
                      </Label>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleCreateNew}
                        disabled={createMutation.isPending}
                        className="gap-2 px-6"
                      >
                        Initialize & Continue <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {!selectedClassId && (
                  <div className="py-10 text-center text-muted-foreground text-sm">
                    Select a class to begin.
                  </div>
                )}
              </div>
            </div>
          </Slide>
        )}

        {/* ── STEP 2: Exam Formula ─────────────────────────────────────── */}
        {step === 2 && (
          <Slide>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Step 2 — Exam Formula</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isSummationMode
                      ? "Add the exams whose raw marks will be summed up."
                      : "Define how each exam contributes by percentage weight."}
                  </p>
                </div>
                {currentRule && (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border
                    ${weightageOk
                      ? "bg-green-500/10 text-green-700 border-green-500/20"
                      : "bg-amber-500/10 text-amber-700 border-amber-500/20"}`}>
                    {isSummationMode ? "Summation Mode" : `${currentRule.totalWeightage ?? 0}% / 100%`}
                  </div>
                )}
              </div>

              {!isLocked && (
                <form
                  onSubmit={handleAddComponent}
                  className="flex items-end gap-3 p-4 bg-muted/30 rounded-xl border border-border mb-6"
                >
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Exam Type</Label>
                    <Select
                      value={compForm.examTypeId ? compForm.examTypeId.toString() : ""}
                      onValueChange={(v) => setCompForm({ ...compForm, examTypeId: parseInt(v) })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select exam..." /></SelectTrigger>
                      <SelectContent>
                        {examTypes.map((et: any) => (
                          <SelectItem key={et.id} value={et.id.toString()}>{et.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label className="text-xs">Weight (%)</Label>
                    <Input
                      type={isSummationMode ? "text" : "number"}
                      min="0" max="100"
                      disabled={isSummationMode}
                      placeholder={isSummationMode ? "N/A" : ""}
                      value={isSummationMode ? "" : (compForm.weightagePercent || "")}
                      onChange={(e) => setCompForm({ ...compForm, weightagePercent: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-2 pl-1">
                    <Checkbox
                      id="must-pass"
                      checked={compForm.mandatoryPass}
                      onCheckedChange={(c) => setCompForm({ ...compForm, mandatoryPass: !!c })}
                    />
                    <Label htmlFor="must-pass" className="text-xs cursor-pointer whitespace-nowrap">
                      Must Pass
                    </Label>
                  </div>
                  <Button type="submit" size="sm" disabled={addComponentMutation.isPending} className="gap-1">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </form>
              )}

              {!currentRule?.components?.length ? (
                <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  No exams added yet.
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Exam Type</TableHead>
                        <TableHead>Weightage</TableHead>
                        <TableHead>Condition</TableHead>
                        {!isLocked && <TableHead className="w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRule.components.map((comp: any) => (
                        <TableRow key={comp.id}>
                          <TableCell className="font-medium">{comp.examTypeName}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {isSummationMode
                              ? <span className="text-muted-foreground italic">N/A</span>
                              : `${comp.weightagePercent}%`}
                          </TableCell>
                          <TableCell>
                            {comp.mandatoryPass && (
                              <span className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                Mandatory Pass
                              </span>
                            )}
                          </TableCell>
                          {!isLocked && (
                            <TableCell>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => deleteComponentMutation.mutate(comp.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!isSummationMode && currentRule?.totalWeightage !== 100 && !!currentRule?.components?.length && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-500">
                    Total weightage is <strong>{currentRule.totalWeightage}%</strong> — must equal 100% to continue.
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button variant="outline" onClick={() => goTo(1)} className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => goTo(3)}
                  disabled={!currentRule?.components?.length || (!isSummationMode && currentRule?.totalWeightage !== 100)}
                  className="gap-1.5"
                >
                  Next: Subject Marks <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Slide>
        )}

        {/* ── STEP 3: Subject Marks ─────────────────────────────────────── */}
        {step === 3 && (
          <Slide>
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">Step 3 — Subject Pass Marks</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isSummationMode
                    ? "Set consolidated pass marks for each subject across all exams."
                    : "Review the pass marks assigned to each subject per exam."}
                </p>
              </div>

              {/* ── SUMMATION MODE ── */}
              {isSummationMode ? (
                (() => {
                  const allExamsScheduled = currentRule?.components?.every((comp: any) =>
                    examSchedules?.some(s => s.examTypeId === comp.examTypeId)
                  );

                  return (
                    <>
                      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          Pass marks apply to each subject's <strong>total score</strong> across all exams.
                          Total Max is derived from the sum of all scheduled exam blueprints.
                        </p>
                      </div>

                      {!allExamsScheduled && (
                        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-amber-700 dark:text-amber-500">
                            <strong>Action Required:</strong> You cannot set consolidated pass marks until all exams in the formula have been scheduled. Please schedule the missing exams first.
                          </p>
                        </div>
                      )}

                      <div className="border border-border rounded-xl overflow-hidden mb-6">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Total Max Marks</TableHead>
                              <TableHead>Consolidated Pass Marks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classSubjects.map((sub: any) => {
                              const totalMax  = getConsolidatedMaxMarks(sub.id);
                              const passVal   = consolidatedPassMarks[sub.id] ?? "";
                              const hasNoMax  = totalMax === 0;

                              return (
                                <TableRow key={sub.id}>
                                  <TableCell className="font-medium">{sub.subjectName}</TableCell>
                                  <TableCell>
                                    {hasNoMax ? (
                                      <span className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                                        No exams scheduled
                                      </span>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="w-20 text-sm font-semibold px-3 py-1.5 bg-muted rounded-md border border-border text-foreground text-center">
                                          {totalMax}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          ({currentRule?.components?.length} exams)
                                        </span>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      className="w-32"
                                      min={0}
                                      max={totalMax || undefined}
                                      placeholder="e.g. 100"
                                      disabled={hasNoMax || !allExamsScheduled}
                                      value={passVal}
                                      onChange={(e) => {
                                        const v = e.target.value === "" ? null : parseFloat(e.target.value);
                                        setConsolidatedPassMarks(prev => ({ ...prev, [sub.id]: v }));
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* --- INDIVIDUAL EXAM DETAILS (NOW WITH TABS) --- */}
                      {currentRule?.components?.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-border">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-medium text-sm text-foreground">
                              Individual Exam Details
                            </h3>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              reference from schedule
                            </span>
                          </div>
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2 mb-4">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              These are the individual blueprints that make up the total scores above. 
                              Exams marked as 'Must Pass' are evaluated independently based on their scheduled pass marks.
                            </p>
                          </div>

                          {/* ── TAB BAR ── */}
                          <div className="flex space-x-2 border-b border-border mb-6 overflow-x-auto pb-1">
                            {currentRule.components.map((comp: any) => (
                              <button
                                key={comp.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveTab(comp.id);
                                }}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                  activeTab === comp.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                              >
                                {comp.examTypeName}
                              </button>
                            ))}
                          </div>

                          {/* ── ACTIVE TAB CONTENT ── */}
                          {(() => {
                            const activeComp = currentRule.components.find((c: any) => c.id === activeTab);
                            if (!activeComp) return null;
                            
                            const scheduleEntry = examSchedules?.find(s => s.examTypeId === activeComp.examTypeId);

                            return (
                              <div className="mb-4 animate-in fade-in duration-200">
                                <div className="flex items-center gap-2 mb-2 px-1">
                                  <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                                    {activeComp.examTypeName}
                                  </h4>
                                  {activeComp.mandatoryPass && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                      Must Pass
                                    </span>
                                  )}
                                </div>
                                <div className="border border-border rounded-xl overflow-hidden bg-background">
                                  <Table>
                                    <TableHeader className="bg-muted/30">
                                      <TableRow>
                                        <TableHead className="h-8 py-1">Subject</TableHead>
                                        <TableHead className="h-8 py-1">Max Marks</TableHead>
                                        <TableHead className="h-8 py-1">Pass Marks</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {classSubjects.map((sub: any) => {
                                        const maxMarks  = getScheduledMaxMarks(activeComp.examTypeId, sub.id);
                                        const passMarks = getScheduledPassMarks(activeComp.examTypeId, sub.id);
                                        return (
                                          <TableRow key={sub.id}>
                                            <TableCell className="py-2 font-medium">{sub.subjectName}</TableCell>
                                            <TableCell className="py-2">
                                              {maxMarks !== null ? (
                                                <span className="text-sm font-medium text-foreground">{maxMarks}</span>
                                              ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                  {scheduleEntry ? "Not in exam" : "Not scheduled"}
                                                </span>
                                              )}
                                            </TableCell>
                                            <TableCell className="py-2">
                                              {passMarks !== null ? (
                                                <span className="text-sm text-muted-foreground">{passMarks}</span>
                                              ) : (
                                                <span className="text-xs text-muted-foreground italic">—</span>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      <div className="flex justify-between mt-8 pt-6 border-t border-border">
                        <Button variant="outline" onClick={() => goTo(2)} className="gap-1.5">
                          <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <Button
                          onClick={handleSaveConsolidated}
                          disabled={saveConsolidatedMutation.isPending}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" /> Save & Continue
                        </Button>
                      </div>
                    </>
                  );
                })()
              ) : (
                /* ── WEIGHTED AVERAGE MODE (Now completely Read-Only Reference) ── */
                <>
                  {(() => {
                    const activeComp    = currentRule?.components?.find((c: any) => c.id === activeTab);
                    const scheduleEntry = examSchedules?.find(s => s.examTypeId === activeComp?.examTypeId);
                    if (!scheduleEntry) return (
                      <div className="mb-5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-700">
                          <strong>{activeComp?.examTypeName}</strong> has no scheduled exam yet.
                          Max marks and Pass marks will auto-populate once the exam blueprint is published.
                        </p>
                      </div>
                    );
                    if (scheduleEntry.status === "ONGOING") return (
                      <div className="mb-5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-700">
                          <strong>{activeComp?.examTypeName}</strong> is currently ongoing.
                          Max marks and Pass marks are loaded from the exam schedule.
                        </p>
                      </div>
                    );
                    return null;
                  })()}

                  <div className="flex space-x-2 border-b border-border mb-6 overflow-x-auto pb-1">
                    {currentRule?.components?.map((comp: any) => (
                      <button
                        key={comp.id}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab(comp.id);
                        }}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === comp.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {comp.examTypeName}
                      </button>
                    ))}
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Max Marks</TableHead>
                          <TableHead>Pass Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classSubjects.map((sub: any) => {
                          const activeComp    = currentRule?.components?.find((c: any) => c.id === activeTab);
                          const scheduleEntry = examSchedules?.find(s => s.examTypeId === activeComp?.examTypeId);
                          const scheduledMax  = activeComp ? getScheduledMaxMarks(activeComp.examTypeId, sub.id) : null;
                          const scheduledPass = activeComp ? getScheduledPassMarks(activeComp.examTypeId, sub.id) : null;

                          return (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium">{sub.subjectName}</TableCell>

                              {/* Max Marks — read-only from blueprint */}
                              <TableCell>
                                {!scheduleEntry ? (
                                  <span className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md whitespace-nowrap">
                                    No scheduled exam
                                  </span>
                                ) : scheduledMax !== null ? (
                                  <div className="flex items-center gap-2">
                                    <span className="w-20 text-sm font-semibold px-3 py-1.5 bg-muted rounded-md border border-border text-foreground text-center">
                                      {scheduledMax}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                      scheduleEntry.status === "COMPLETED"  ? "bg-green-500/10 text-green-700"  :
                                      scheduleEntry.status === "EVALUATION" ? "bg-blue-500/10 text-blue-700"   :
                                      scheduleEntry.status === "ONGOING"    ? "bg-amber-500/10 text-amber-700" :
                                      "bg-muted text-muted-foreground"
                                    }`}>{scheduleEntry.status}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Subject not in exam</span>
                                )}
                              </TableCell>

                              {/* Pass Marks — ALWAYS read-only from blueprint now */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {scheduledPass !== null ? (
                                    <span className="w-20 text-sm px-3 py-1.5 bg-muted/50 rounded-md border border-border text-muted-foreground text-center">
                                      {scheduledPass}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">—</span>
                                  )}
                                  <span className="text-xs text-muted-foreground italic">
                                    from blueprint
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between mt-8 pt-6 border-t border-border">
                    <Button variant="outline" onClick={() => goTo(2)} className="gap-1.5">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button onClick={handleSaveSubjects} disabled={saveSubjectsMutation.isPending} className="gap-2">
                      <Save className="h-4 w-4" /> Save & Continue
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Slide>
        )}

        {/* ── STEP 4: Review & Lock ─────────────────────────────────────── */}
        {step === 4 && (
          <Slide>
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">Step 4 — Review & Lock</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Review the configuration before locking it. Locked rules cannot be edited.
                </p>
              </div>

              {currentRule && (
                <div className="space-y-6">
                  {/* Summary card */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Class",       value: currentRule.classLevelName },
                      { label: "Year",        value: currentRule.academicYearName },
                      { label: "Mode",        value: isSummationMode ? "Pure Summation" : "Weighted Average" },
                      { label: "Scheme",      value: currentRule.gradingSchemeName },
                      { label: "Grace Marks", value: currentRule.applyGraceMarks ? "Yes" : "No" },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 bg-muted/40 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                        <p className="font-semibold text-sm text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Exam formula */}
                  <div>
                    <h3 className="font-medium text-sm mb-3 text-foreground">Exam Formula</h3>
                    <div className="border border-border rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Exam</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Condition</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentRule.components.map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">
                                {c.examTypeName}
                                {!examSchedules?.some(s => s.examTypeId === c.examTypeId) && (
                                  <span className="ml-2 text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Unscheduled
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {isSummationMode ? "—" : `${c.weightagePercent}%`}
                              </TableCell>
                              <TableCell>
                                {c.mandatoryPass && (
                                  <span className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                    Mandatory Pass
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Subject pass marks — strategy-aware */}
                  {isSummationMode ? (
                    /* SUMMATION: single consolidated table */
                    <>
                      {currentRule.consolidatedSubjectRules?.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-medium text-sm mb-3 text-foreground">
                            Subject Pass Marks (Consolidated)
                          </h3>
                          <div className="border border-border rounded-xl overflow-hidden">
                            <Table>
                              <TableHeader className="bg-muted/50">
                                <TableRow>
                                  <TableHead>Subject</TableHead>
                                  <TableHead>Total Max Marks</TableHead>
                                  <TableHead>Pass Marks</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {currentRule.consolidatedSubjectRules.map((sr: any) => (
                                  <TableRow key={sr.id}>
                                    <TableCell className="font-medium">{sr.subjectName}</TableCell>
                                    <TableCell>{sr.consolidatedMaxMarks}</TableCell>
                                    <TableCell>{sr.consolidatedPassMarks}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {currentRule.components?.length > 0 && (
                        <div>
                          <h3 className="font-medium text-sm mb-3 text-foreground">Individual Exam Details</h3>
                          {currentRule.components.map((comp: any) => {
                            const scheduleEntry = examSchedules?.find(s => s.examTypeId === comp.examTypeId);
                            return (
                              <div key={comp.id} className="mb-4">
                                <div className="flex items-center gap-2 mb-2 px-1">
                                  <h4 className="font-medium text-xs text-muted-foreground">
                                    {comp.examTypeName}
                                  </h4>
                                  {comp.mandatoryPass && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                      Must Pass
                                    </span>
                                  )}
                                </div>
                                <div className="border border-border rounded-xl overflow-hidden bg-background">
                                  <Table>
                                    <TableHeader className="bg-muted/30">
                                      <TableRow>
                                        <TableHead className="h-8 py-1">Subject</TableHead>
                                        <TableHead className="h-8 py-1">Max Marks</TableHead>
                                        <TableHead className="h-8 py-1">Pass Marks</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {classSubjects.map((sub: any) => {
                                        const maxMarks  = getScheduledMaxMarks(comp.examTypeId, sub.id);
                                        const passMarks = getScheduledPassMarks(comp.examTypeId, sub.id);
                                        return (
                                          <TableRow key={sub.id}>
                                            <TableCell className="py-2 font-medium">{sub.subjectName}</TableCell>
                                            <TableCell className="py-2">
                                              {maxMarks !== null ? maxMarks : <span className="text-xs text-muted-foreground italic">{scheduleEntry ? "Not in exam" : "Not scheduled"}</span>}
                                            </TableCell>
                                            <TableCell className="py-2">
                                              {passMarks !== null ? passMarks : <span className="text-xs text-muted-foreground italic">—</span>}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    /* WEIGHTED AVERAGE: per-component tables */
                    currentRule.components?.some((c: any) => c.subjectRules?.length > 0) && (
                      <div>
                        <h3 className="font-medium text-sm mb-3 text-foreground">Subject Pass Marks</h3>
                        {currentRule.components
                          .filter((c: any) => c.subjectRules?.length > 0)
                          .map((comp: any) => (
                          <div key={comp.id} className="mb-4">
                            <h4 className="font-medium text-xs text-muted-foreground mb-2 px-1">
                              {comp.examTypeName}
                            </h4>
                            <div className="border border-border rounded-xl overflow-hidden bg-background">
                              <Table>
                                <TableHeader className="bg-muted/30">
                                  <TableRow>
                                    <TableHead className="h-8 py-1">Subject</TableHead>
                                    <TableHead className="h-8 py-1">Max Marks</TableHead>
                                    <TableHead className="h-8 py-1">Pass Marks</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {comp.subjectRules.map((sr: any) => (
                                    <TableRow key={sr.id}>
                                      <TableCell className="font-medium py-2">{sr.subjectName}</TableCell>
                                      <TableCell className="py-2">{sr.targetMaxMarks}</TableCell>
                                      <TableCell className="py-2">{sr.minPassMarks}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Lock / published banner */}
                  {isLocked ? (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                      <Lock className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-green-700 dark:text-green-400">
                          Configuration is Locked & Published
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          This rule is live. Delete and recreate to make changes.
                        </p>
                      </div>
                    </div>
                  ) : (() => {
                    // Check for any unscheduled exams
                    const unscheduledExams = currentRule.components.filter((comp: any) =>
                      !examSchedules?.some(s => s.examTypeId === comp.examTypeId)
                    );

                    if (unscheduledExams.length > 0) {
                      return (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 mt-6">
                          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                          <div className="w-full">
                            <p className="text-sm font-semibold text-destructive mb-1">
                              Cannot Lock Configuration
                            </p>
                            <p className="text-xs text-destructive/80 mb-2">
                              All exams defined in your formula must be scheduled before you can publish this rule. The following exams are missing their blueprints:
                            </p>
                            <ul className="list-disc list-inside text-xs font-medium text-destructive/90 mb-4">
                              {unscheduledExams.map((ue: any) => (
                                <li key={ue.id}>{ue.examTypeName}</li>
                              ))}
                            </ul>
                            <Button disabled className="gap-2 w-full opacity-50">
                              <Lock className="h-4 w-4" /> Lock & Publish Configuration
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    // If all exams are scheduled, show the normal publish block
                    return (
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl mt-6">
                        <p className="text-sm text-foreground font-medium mb-1">Ready to publish?</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Locking prevents any further edits. Make sure everything looks correct above.
                        </p>
                        <Button
                          onClick={() => lockMutation.mutate()}
                          disabled={lockMutation.isPending}
                          className="gap-2 w-full"
                        >
                          <Lock className="h-4 w-4" /> Lock & Publish Configuration
                        </Button>
                      </div>
                    );
                  })()}

                  {!isLocked && (
                    <div className="pt-4 border-t border-border flex justify-between items-center">
                      <Button variant="outline" onClick={() => goTo(3)} className="gap-1.5">
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 gap-1.5"
                        onClick={() => {
                          if (window.confirm("Delete this entire configuration?"))
                            deleteRuleMutation.mutate(currentRule.id);
                        }}
                        disabled={deleteRuleMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" /> Delete Configuration
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Slide>
        )}

      </div>
    </div>
  );
}