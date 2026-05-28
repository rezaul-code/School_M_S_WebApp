import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Network, Calculator, Trophy, CheckCircle2, XCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { api } from "@/lib/api/client";
import { calculateBulk, getClassResults, clearClassResults, publishResult, unpublishResult } from "@/lib/api/results";

import "@/styles/master-data.css";

export default function ConsolidatedAnnual() {
  const queryClient = useQueryClient();
  const { data: activeYear } = useActiveAcademicYear();
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  // Fetch Classes for Dropdown
  const { data: classes = [] } = useQuery({
    queryKey: ["classLevels"],
    queryFn: async () => {
      const res = await api.get("/api/options/class-levels");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    }
  });

  // Fetch Results for Selected Class
  const { data: results = [], isLoading: isLoadingResults, refetch } = useQuery({
    queryKey: ["classResults", activeYear?.id, selectedClassId],
    queryFn: () => getClassResults(activeYear!.id, parseInt(selectedClassId)),
    enabled: !!activeYear?.id && !!selectedClassId,
  });

  // Mutations
  const calcMutation = useMutation({
    mutationFn: () => calculateBulk(activeYear!.id, parseInt(selectedClassId), true),
    onSuccess: (data) => {
      if (data.failedCount > 0) {
        toast.warning(`Calculated ${data.successCount} students, but ${data.failedCount} failed. Check configuration.`);
      } else {
        toast.success(`Successfully calculated results and assigned ranks for ${data.successCount} students.`);
      }
      refetch();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to run calculation engine.")
  });

  const publishMutation = useMutation({
    mutationFn: (enrollmentId: number) => publishResult(enrollmentId),
    onSuccess: () => {
      toast.success("Report card published.");
      refetch();
    }
  });

  const unpublishMutation = useMutation({
    mutationFn: (enrollmentId: number) => unpublishResult(enrollmentId),
    onSuccess: () => {
      toast.success("Report card unpublished.");
      refetch();
    }
  });

  // Add this new mutation
  const clearResultsMutation = useMutation({
    mutationFn: () => clearClassResults(activeYear!.id, parseInt(selectedClassId)),
    onSuccess: () => {
      toast.success("All calculated results for this class have been cleared.");
      refetch(); // Refresh the table
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to clear results.")
  });

  return (
    <div className="md-page">
      

      <div className="md-card p-5 border border-border mb-6 flex flex-col md:flex-row gap-4 items-end bg-muted/10">
        <div className="space-y-2 flex-1 max-w-xs">
          <Label>Academic Year</Label>
          <Input value={activeYear?.name || "Loading..."} disabled className="bg-muted" />
        </div>
        <div className="space-y-2 flex-1 max-w-xs">
          <Label>Target Class Level</Label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger><SelectValue placeholder="Select class..." /></SelectTrigger>
            <SelectContent>
              {classes.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.label || c.displayName || c.name || `Class ${c.id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* ACTION BUTTONS WRAPPER */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 bg-white" 
            disabled={!selectedClassId || results.length === 0 || clearResultsMutation.isPending}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete all calculated report cards for this class? Raw marks will NOT be deleted.")) {
                clearResultsMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Clear Results
          </Button>

          <Button 
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white" 
            disabled={!selectedClassId || calcMutation.isPending}
            onClick={() => calcMutation.mutate()}
          >
            {calcMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            Run Calculation Engine
          </Button>
        </div>
      </div>

      {!selectedClassId ? (
        <div className="md-empty border border-dashed border-border rounded-xl p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Select a Class</h3>
          <p className="text-muted-foreground text-sm">Choose a class level above to view or calculate annual results.</p>
        </div>
      ) : isLoadingResults ? (
        <div className="md-card p-12 text-center text-muted-foreground animate-pulse border border-border">Loading results...</div>
      ) : results.length === 0 ? (
        <div className="md-empty border border-dashed border-border rounded-xl p-12 text-center">
          <Calculator className="h-12 w-12 mx-auto opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No Results Found</h3>
          <p className="text-muted-foreground text-sm mb-4">You have not calculated results for this class yet, or no students are enrolled.</p>
          <Button variant="outline" onClick={() => calcMutation.mutate()} disabled={calcMutation.isPending}>
            Run Calculation Now
          </Button>
        </div>
      ) : (
        <div className="md-card border border-border overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold text-lg">Class Ledger ({results.length} Students)</h3>
          </div>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((res: any) => (
                <TableRow key={res.id}>
                  <TableCell>
                    {res.rankInClass ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        #{res.rankInClass}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{res.studentName}</div>
                    <div className="text-xs text-muted-foreground">{res.studentRegistrationNo}</div>
                  </TableCell>
                  <TableCell className="font-mono font-medium">{res.percentage}%</TableCell>
                  <TableCell><span className="font-bold text-primary">{res.grade}</span></TableCell>
                  <TableCell>
                    {res.resultStatus === "PASS" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-md"><CheckCircle2 className="h-3.5 w-3.5" /> PASS</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-500/10 px-2 py-1 rounded-md"><XCircle className="h-3.5 w-3.5" /> {res.resultStatus}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {res.published ? (
                      <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => unpublishMutation.mutate(res.enrollmentId)}>
                        <EyeOff className="h-4 w-4 mr-1" /> Unpublish
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="text-primary" onClick={() => publishMutation.mutate(res.enrollmentId)}>
                        <Eye className="h-4 w-4 mr-1" /> Publish
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}