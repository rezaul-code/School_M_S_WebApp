import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldCheck, CheckCircle2, XCircle, Trash2, ShieldAlert, ArrowLeft, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { 
  getAllGradingSchemes, 
  createGradingScheme, 
  addGradeScale, 
  setSchemeAsDefault, 
  removeGradeScale,
  CreateGradingSchemeRequest,
  AddGradeScaleRequest
} from "@/lib/api/gradingSchemes";

import "@/styles/master-data.css";

export default function GradingSchemes() {
  const queryClient = useQueryClient();
  
  // View States
  const [isCreatingScheme, setIsCreatingScheme] = useState(false);
  const [addingScaleForSchemeId, setAddingScaleForSchemeId] = useState<number | null>(null);

  // Form States
  const [schemeForm, setSchemeForm] = useState<CreateGradingSchemeRequest>({ name: "", description: "", default: false });
  const [scaleForm, setScaleForm] = useState<AddGradeScaleRequest>({
    gradeLabel: "", minPercent: 0, maxPercent: 100, pass: true, description: "", gradePoint: 0
  });

  // Queries
  const { data: schemes = [], isLoading } = useQuery({
    queryKey: ["gradingSchemes"],
    queryFn: getAllGradingSchemes,
  });

  // Mutations
  const createSchemeMutation = useMutation({
    mutationFn: createGradingScheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
      toast.success("Grading scheme created.");
      setIsCreatingScheme(false);
      setSchemeForm({ name: "", description: "", default: false });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to create scheme")
  });

  const addScaleMutation = useMutation({
    mutationFn: (data: AddGradeScaleRequest) => addGradeScale(addingScaleForSchemeId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
      toast.success("Grade scale added.");
      setAddingScaleForSchemeId(null);
      setScaleForm({ gradeLabel: "", minPercent: 0, maxPercent: 100, pass: true, description: "", gradePoint: 0 });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to add grade scale")
  });

  const defaultMutation = useMutation({
    mutationFn: setSchemeAsDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
      toast.success("Default scheme updated.");
    }
  });

  const deleteScaleMutation = useMutation({
    mutationFn: removeGradeScale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingSchemes"] });
      toast.success("Scale deleted.");
    }
  });

  // Handlers
  const handleCreateScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeForm.name) return toast.error("Scheme Name is required");
    createSchemeMutation.mutate(schemeForm);
  };

  const handleAddScale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scaleForm.gradeLabel) return toast.error("Grade Label is required");
    addScaleMutation.mutate(scaleForm);
  };

  // ---------------------------------------------------------
  // VIEW 1: CREATE SCHEME FORM
  // ---------------------------------------------------------
  if (isCreatingScheme) {
    return (
      <div className="md-page">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => setIsCreatingScheme(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create New Grading Scheme</h2>
            <p className="text-muted-foreground">Define a new master grading policy</p>
          </div>
        </div>

        <div className="md-card max-w-3xl p-6 border border-border">
          <form onSubmit={handleCreateScheme} className="space-y-6">
            <div className="space-y-2">
              <Label>Scheme Name *</Label>
              <Input 
                placeholder="e.g., CBSE 2024 Standard" 
                value={schemeForm.name} 
                onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })} 
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="Brief details about this grading rule" 
                value={schemeForm.description} 
                onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })} 
              />
            </div>
            <div className="flex items-center gap-2 pt-2 bg-muted/30 p-4 rounded-lg border border-border">
              <Checkbox 
                id="default-check" 
                checked={schemeForm.default} 
                onCheckedChange={(c) => setSchemeForm({ ...schemeForm, default: !!c })} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="default-check" className="cursor-pointer font-medium">Set as System Default</Label>
                <p className="text-sm text-muted-foreground">This will automatically replace the current default scheme.</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsCreatingScheme(false)}>Cancel</Button>
              <Button type="submit" disabled={createSchemeMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" /> 
                {createSchemeMutation.isPending ? "Saving..." : "Save Scheme"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // VIEW 2: LIST SCHEMES & INLINE GRADE BANDS
  // ---------------------------------------------------------
  return (
    <div className="md-page">
      

      <div className="grid gap-6">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading grading schemes...</div>
        ) : schemes.length === 0 ? (
           <div className="md-card border border-border p-12 text-center text-muted-foreground">
             <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-20" />
             <h3 className="text-lg font-medium text-foreground mb-1">No Schemes Found</h3>
             <p className="mb-4">You haven't created any grading schemes yet.</p>
             <Button onClick={() => setIsCreatingScheme(true)} variant="outline">Create your first scheme</Button>
           </div>
        ) : (
          schemes.map((scheme) => (
            <div key={scheme.id} className="md-card border border-border overflow-hidden">
              {/* Scheme Header */}
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/10">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{scheme.name}</h3>
                    {scheme.default && (
                      <span className="md-badge md-badge--blue text-xs gap-1 py-0.5"><CheckCircle2 className="h-3 w-3" /> Default</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{scheme.description || "No description provided."}</p>
                </div>
                <div className="flex gap-3">
                  {!scheme.default && (
                    <Button variant="outline" size="sm" onClick={() => defaultMutation.mutate(scheme.id)} disabled={defaultMutation.isPending}>
                      Make Default
                    </Button>
                  )}
                  {addingScaleForSchemeId !== scheme.id && (
                    
                    <Button size="sm" onClick={() => setAddingScaleForSchemeId(scheme.id)} className="gap-1">
                      <Plus className="h-4 w-4" /> Add Grade Band
                    </Button>
                    
                  )}
                  <Button onClick={() => setIsCreatingScheme(true)} className="gap-2 h-9 text-sm relative z-10">
                    <Plus className="h-4 w-4" /> New Scheme
                  </Button>
                </div>
              </div>

              <div className="p-5">
                {/* INLINE ADD SCALE FORM */}
                {addingScaleForSchemeId === scheme.id && (
                  <div className="mb-6 p-4 bg-muted/30 border border-border rounded-lg relative">
                    <Button 
                      variant="ghost" size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 text-muted-foreground" 
                      onClick={() => setAddingScaleForSchemeId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" /> New Grade Band
                    </h4>
                    
                    <form onSubmit={handleAddScale} className="grid gap-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5"><Label className="text-xs">Grade Label (e.g. A+)</Label><Input size={1} value={scaleForm.gradeLabel} onChange={(e) => setScaleForm({ ...scaleForm, gradeLabel: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label className="text-xs">GPA / Grade Point</Label><Input size={1} type="number" step="0.1" value={scaleForm.gradePoint || ""} onChange={(e) => setScaleForm({ ...scaleForm, gradePoint: parseFloat(e.target.value) })} /></div>
                        <div className="space-y-1.5"><Label className="text-xs">Min Percentage (%)</Label><Input size={1} type="number" step="0.01" value={scaleForm.minPercent} onChange={(e) => setScaleForm({ ...scaleForm, minPercent: parseFloat(e.target.value) })} /></div>
                        <div className="space-y-1.5"><Label className="text-xs">Max Percentage (%)</Label><Input size={1} type="number" step="0.01" value={scaleForm.maxPercent} onChange={(e) => setScaleForm({ ...scaleForm, maxPercent: parseFloat(e.target.value) })} /></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-xs">Remarks/Description</Label>
                          <Input size={1} placeholder="e.g. Outstanding" value={scaleForm.description} onChange={(e) => setScaleForm({ ...scaleForm, description: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2 pb-2">
                          <Checkbox id={`pass-${scheme.id}`} checked={scaleForm.pass} onCheckedChange={(c) => setScaleForm({ ...scaleForm, pass: !!c })} />
                          <Label htmlFor={`pass-${scheme.id}`} className="cursor-pointer text-sm">Counts as Passing Grade</Label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setAddingScaleForSchemeId(null)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={addScaleMutation.isPending} className="gap-2">
                          <Save className="h-3.5 w-3.5" /> Save Band
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* SCALES TABLE */}
                {scheme.gradeScales && scheme.gradeScales.length > 0 ? (
                  <div className="border border-border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[120px]">Grade Label</TableHead>
                          <TableHead>Range (%)</TableHead>
                          <TableHead>GPA</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheme.gradeScales.map((scale) => (
                          <TableRow key={scale.id} className="hover:bg-muted/20 transition-colors border-border">
                            <TableCell className="font-bold text-primary">{scale.gradeLabel}</TableCell>
                            <TableCell className="font-mono text-sm">{scale.minPercent}% - {scale.maxPercent}%</TableCell>
                            <TableCell>{scale.gradePoint || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{scale.description || "—"}</TableCell>
                            <TableCell>
                              {scale.pass 
                                ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-md"><CheckCircle2 className="h-3.5 w-3.5" /> Pass</span> 
                                : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-500/10 px-2 py-1 rounded-md"><XCircle className="h-3.5 w-3.5" /> Fail</span>}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => deleteScaleMutation.mutate(scale.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  !addingScaleForSchemeId && (
                    <div className="md-empty py-8 text-center text-muted-foreground">
                      <ShieldAlert className="h-10 w-10 mx-auto opacity-20 mb-3" />
                      <p>No grade bands configured for this scheme yet.</p>
                      <Button variant="link" onClick={() => setAddingScaleForSchemeId(scheme.id)}>Add your first grade band</Button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}