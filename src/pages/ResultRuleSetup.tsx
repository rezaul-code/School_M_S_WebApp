import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Network, Plus, Trash2, Save, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { getAllGradingSchemes } from "@/lib/api/gradingSchemes";
import { getAllExamTypes } from "@/lib/api/exams";
import { api } from "@/lib/api/client"; 
import { 
  getResultRule, 
  getRulesByYear,
  createResultRule, 
  addRuleComponent, 
  removeRuleComponent,
  deleteResultRule,
  CreateResultRuleRequest,
  AddRuleComponentRequest
} from "@/lib/api/resultRules";

export default function ResultRuleSetup() {
  const queryClient = useQueryClient();
  const { data: activeYear } = useActiveAcademicYear();
  
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  
  // Create Form State
  const [createForm, setCreateForm] = useState<Partial<CreateResultRuleRequest>>({
    promotionMinPercent: 33.0,
    applyGraceMarks: false,
    strategyType: "WEIGHTED_AVERAGE" // Default mode
  });

  // Component Form State
  const [compForm, setCompForm] = useState<AddRuleComponentRequest>({
    examTypeId: 0, weightagePercent: 0, mandatoryPass: false
  });

  // Master Data Queries
  const { data: classes = [] } = useQuery({
    queryKey: ["classLevels"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/options/class-levels");
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch class levels:", error);
        toast.error("Failed to load class levels");
        return [];
      }
    }
  });
  
  const { data: schemes = [] } = useQuery({
    queryKey: ["gradingSchemes"],
    queryFn: getAllGradingSchemes
  });
  
  const { data: examTypes = [] } = useQuery({
    queryKey: ["examTypes"],
    queryFn: getAllExamTypes
  });

  // Fetch Current Rule
  const { data: currentRule, isLoading: isLoadingRule } = useQuery({
    queryKey: ["resultRule", activeYear?.id, selectedClassId],
    queryFn: () => getResultRule(activeYear!.id, parseInt(selectedClassId)),
    enabled: !!activeYear?.id && !!selectedClassId,
  });

  // Fetch Previous Year's Rules (For Cloning)
  const { data: previousRules = [] } = useQuery({
    queryKey: ["previousRules", activeYear?.id],
    queryFn: () => getRulesByYear(activeYear!.id - 1), 
    enabled: !!activeYear?.id,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createResultRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Result configuration initialized.");
    }
  });

  const addComponentMutation = useMutation({
    mutationFn: (data: AddRuleComponentRequest) => addRuleComponent(currentRule!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Exam attached to rule.");
      setCompForm({ examTypeId: 0, weightagePercent: 0, mandatoryPass: false });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add exam to rule")
  });

  const deleteComponentMutation = useMutation({
    mutationFn: removeRuleComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Exam removed from rule.");
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteResultRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resultRule"] });
      toast.success("Result configuration deleted successfully.");
    },
    onError: (err: any) => {
      // This catches the Safe Delete guardrail from Java!
      toast.error(err.response?.data?.message || "Cannot delete configuration.");
    }
  });

  // Handlers
  const handleCreateNew = () => {
    if (!selectedClassId || !createForm.gradingSchemeId) {
      return toast.error("Please select a Grading Scheme.");
    }
    createMutation.mutate({
      name: `${activeYear?.name} - Class Rule`,
      academicYearId: activeYear!.id,
      classLevelId: parseInt(selectedClassId),
      strategyType: createForm.strategyType || "WEIGHTED_AVERAGE",
      gradingSchemeId: createForm.gradingSchemeId,
      promotionMinPercent: createForm.promotionMinPercent || 33,
      applyGraceMarks: createForm.applyGraceMarks || false
    });
  };

  const handleClonePrevious = () => {
    const prevRule = previousRules.find(r => r.classLevelId === parseInt(selectedClassId));
    if (!prevRule) return toast.error("No previous year configuration found for this class.");

    createMutation.mutate({
      name: `${activeYear?.name} - Cloned Rule`,
      academicYearId: activeYear!.id,
      classLevelId: parseInt(selectedClassId),
      strategyType: prevRule.strategyType, // Clone the strategy type too!
      gradingSchemeId: prevRule.gradingSchemeId,
      promotionMinPercent: prevRule.promotionMinPercent,
      applyGraceMarks: prevRule.applyGraceMarks
    }, {
      onSuccess: async (newRule) => {
        for (const comp of prevRule.components) {
          await addRuleComponent(newRule.id, {
            examTypeId: comp.examTypeId,
            weightagePercent: comp.weightagePercent,
            mandatoryPass: comp.mandatoryPass
          });
        }
        queryClient.invalidateQueries({ queryKey: ["resultRule"] });
        toast.success("Configuration successfully cloned from previous year!");
      }
    });
  };

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    const isSummation = currentRule?.strategyType === "SUMMATION";
    
    // In summation mode, weightage is ignored, so we bypass the > 0 check
    if (!compForm.examTypeId || (!isSummation && compForm.weightagePercent <= 0)) {
      return toast.error("Select an exam and enter a valid weightage.");
    }

    addComponentMutation.mutate({
      ...compForm,
      weightagePercent: isSummation ? 0 : compForm.weightagePercent // force 0 if summation
    });
  };

  const isSummationMode = currentRule?.strategyType === "SUMMATION";

  return (
    <div className="md-page">
      

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTEXT SELECTION */}
        <div className="md:col-span-1 space-y-6">
          <div className="md-card p-5 border border-border">
            <h3 className="font-semibold mb-4 text-foreground">1. Select Target Class</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={activeYear?.name || "Loading..."} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Class Level</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class..." /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                     <SelectItem key={c.id} value={c.id.toString()}>
                        {c.label || c.displayName || c.name || `Class ID: ${c.id}`}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {currentRule && (
            <div className="md-card p-5 border border-border bg-primary/5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Active Configuration
                </h3>
                
                {/* ---> NEW DELETE CONFIGURATION BUTTON <--- */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this entire class configuration?")) {
                      deleteRuleMutation.mutate(currentRule.id);
                    }
                  }}
                  disabled={deleteRuleMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-medium truncate ml-2 text-primary">
                    {isSummationMode ? "Pure Summation" : "Weighted Average"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheme:</span>
                  <span className="font-medium truncate ml-2">{currentRule.gradingSchemeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pass Mark:</span>
                  <span className="font-medium">{currentRule.promotionMinPercent}%</span>
                </div>
                {!isSummationMode && (
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground">Total Weight:</span>
                    <span className={`font-bold ${currentRule.totalWeightage === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                      {currentRule.totalWeightage}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: RULE SETUP */}
        <div className="md:col-span-2">
          {!selectedClassId ? (
            <div className="md-empty border border-dashed border-border rounded-xl h-full flex flex-col items-center justify-center p-12">
              <Network className="h-12 w-12 mx-auto opacity-20 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No Class Selected</h3>
              <p className="text-muted-foreground text-center">Select a class level on the left to configure or view its result rules for the current academic year.</p>
            </div>
          ) : isLoadingRule ? (
            <div className="md-card p-8 text-center text-muted-foreground animate-pulse border border-border">Checking configuration...</div>
          ) : !currentRule ? (
            
            // --- STATE: NO RULE EXISTS YET ---
            <div className="md-card border border-border p-6">
              <div className="text-center mb-6">
                <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-2 opacity-80" />
                <h3 className="text-lg font-semibold">No Rule Configured</h3>
                <p className="text-sm text-muted-foreground">This class does not have a result formula for {activeYear?.name}.</p>
              </div>

              {previousRules.some(r => r.classLevelId === parseInt(selectedClassId)) && (
                <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">We found a configuration for this class from the previous academic year.</p>
                  <Button onClick={handleClonePrevious} className="bg-blue-600 hover:bg-blue-700 text-white gap-2" disabled={createMutation.isPending}>
                    <Copy className="h-4 w-4" /> Clone Previous Year's Setup
                  </Button>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or Setup from Scratch</span></div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Calculation Strategy</Label>
                    <Select value={createForm.strategyType} onValueChange={(val) => setCreateForm({...createForm, strategyType: val})}>
                      <SelectTrigger><SelectValue placeholder="Select strategy..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEIGHTED_AVERAGE">Weighted Percentages</SelectItem>
                        <SelectItem value="SUMMATION">Pure Summation (Raw Marks)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Attach Grading Scheme</Label>
                    <Select onValueChange={(val) => setCreateForm({...createForm, gradingSchemeId: parseInt(val)})}>
                      <SelectTrigger><SelectValue placeholder="Select scheme..." /></SelectTrigger>
                      <SelectContent>
                        {schemes.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Promotion %</Label>
                    <Input type="number" value={createForm.promotionMinPercent} onChange={(e) => setCreateForm({...createForm, promotionMinPercent: parseFloat(e.target.value)})} />
                  </div>
                  <div className="flex items-center gap-2 mt-8">
                    <Checkbox id="grace" checked={createForm.applyGraceMarks} onCheckedChange={(c) => setCreateForm({...createForm, applyGraceMarks: !!c})} />
                    <Label htmlFor="grace" className="cursor-pointer">Apply Grace Marks Automatically</Label>
                  </div>
                </div>
                <Button onClick={handleCreateNew} className="w-full mt-2" disabled={createMutation.isPending}>Initialize Configuration</Button>
              </div>
            </div>

          ) : (

            // --- STATE: RULE EXISTS (ADD COMPONENTS) ---
            <div className="md-card border border-border flex flex-col">
              <div className="p-5 border-b border-border bg-muted/10 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Exam Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSummationMode 
                      ? "Add exams to sum up their raw maximum and obtained marks." 
                      : "Define how different exams contribute to the final result."}
                  </p>
                </div>
              </div>
              
              <div className="p-5">
                {/* Add new component inline form */}
                <form onSubmit={handleAddComponent} className="flex items-end gap-3 p-4 bg-muted/30 rounded-lg border border-border mb-6">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Exam Type</Label>
                    <Select 
                      value={compForm.examTypeId ? compForm.examTypeId.toString() : ""} 
                      onValueChange={(val) => setCompForm({...compForm, examTypeId: parseInt(val)})}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Exam..." /></SelectTrigger>
                      <SelectContent>
                        {examTypes.map((et) => (
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
                      onChange={(e) => setCompForm({...compForm, weightagePercent: parseFloat(e.target.value)})} 
                    />
                  </div>
                  <div className="w-28 flex items-center gap-2 pb-2 pl-2">
                    <Checkbox 
                      id="must-pass" 
                      checked={compForm.mandatoryPass}
                      onCheckedChange={(c) => setCompForm({...compForm, mandatoryPass: !!c})}
                    />
                    <Label htmlFor="must-pass" className="text-xs cursor-pointer">Must Pass</Label>
                  </div>
                  <Button type="submit" size="sm" disabled={addComponentMutation.isPending} className="gap-1">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </form>

                {/* Table of components */}
                {currentRule.components.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No exams linked yet. Total calculated result will be 0.</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Exam Type</TableHead>
                          <TableHead>Weightage</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRule.components.map((comp) => (
                          <TableRow key={comp.id}>
                            <TableCell className="font-medium">{comp.examTypeName}</TableCell>
                            <TableCell className="font-mono">
                              {isSummationMode ? <span className="text-muted-foreground italic">N/A</span> : `${comp.weightagePercent}%`}
                            </TableCell>
                            <TableCell>
                              {comp.mandatoryPass && <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md border border-amber-500/20">Mandatory Pass</span>}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteComponentMutation.mutate(comp.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Hide the 100% weightage warning if using Pure Summation */}
                {!isSummationMode && currentRule.totalWeightage !== 100 && currentRule.components.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-500">
                      Warning: Total weightage is currently <strong>{currentRule.totalWeightage}%</strong>. Final calculations may be skewed unless weightages sum to exactly 100%.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}