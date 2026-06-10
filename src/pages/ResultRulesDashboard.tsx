//src/pages/ResultRulesDashboard.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Lock, Edit2, Eye, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";

import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { getRulesByYear } from "@/lib/api/resultRules";

interface ResultRulesDashboardProps {
  onCreateNew: () => void;
  onEditRule: (classLevelId: string) => void;
}

export default function ResultRulesDashboard({ onCreateNew, onEditRule }: ResultRulesDashboardProps) {
  const { data: activeYear } = useActiveAcademicYear();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["previousRules", activeYear?.id], // Reusing your existing query key convention
    queryFn: () => getRulesByYear(activeYear!.id),
    enabled: !!activeYear?.id,
  });

  // Filter rules based on search input (e.g., searching for "CLASS_ONE")
  const filteredRules = rules.filter((rule: any) =>
    rule.classLevelName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="md-page max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Result Rules Mapping
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage grading and result calculation formulas for {activeYear?.name || "the academic year"}.
          </p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Configuration
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="md-card border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Class Level</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Grading Scheme</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Loading configurations...
                </TableCell>
              </TableRow>
            ) : filteredRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-10 w-10 mb-3 opacity-20" />
                    <p>No result rules configured yet.</p>
                    <p className="text-sm mt-1">Click "Create Configuration" to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRules.map((rule: any) => (
                <TableRow key={rule.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">
                    {rule.classLevelName}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {rule.strategyType === "SUMMATION" ? "Pure Summation" : "Weighted Average"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{rule.gradingSchemeName}</TableCell>
                  <TableCell>
                    {rule.isLocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-500/20">
                        <Edit2 className="h-3 w-3" /> Draft
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onEditRule(rule.classLevelId.toString())}
                    >
                      {rule.isLocked ? (
                        <>
                          <Eye className="h-4 w-4 mr-1.5" /> View
                        </>
                      ) : (
                        <>
                          <Edit2 className="h-4 w-4 mr-1.5" /> Edit
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}