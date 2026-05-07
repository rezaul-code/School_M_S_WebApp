import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Filter, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SubmitButton from "@/components/common/SubmitButton";
import EmptyState from "@/components/common/EmptyState";
import LoadingTable from "@/components/common/LoadingTable";

import { getFilteredFeeStructures } from "@/lib/api/feeStructures";
import { 
  getClassLevelOptions, 
  listAcademicYears 
} from "@/lib/api/master";
import { getDropdownOptions } from "@/lib/api/options";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  classLevelId: z.string().optional(),
  academicYearId: z.string().optional().refine(
    (val) => !val || !isNaN(Number(val)),
    "Academic Year ID must be a number"
  ),
  feeType: z.string().optional(),
  frequency: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function FilteredFeeStructuresPanel() {
  const [response, setResponse] = useState<any>(null);
  const [appliedFilters, setAppliedFilters] = useState<Partial<Values>>({});

  // Fetch dropdown options
  const classesQuery = useQuery({
    queryKey: ["class-levels"],
    queryFn: getClassLevelOptions,
  });

  const academicYearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: listAcademicYears,
  });

  const feeTypesQuery = useQuery({
    queryKey: ["fee-types"],
    queryFn: () => getDropdownOptions("fee-types"),
  });

  const frequenciesQuery = useQuery({
    queryKey: ["fee-frequencies"],
    queryFn: () => getDropdownOptions("fee-frequencies"),
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      classLevelId: "",
      academicYearId: "",
      feeType: "",
      frequency: "",
    },
  });

  const filterMutation = useMutation({
    mutationFn: (v: Values) =>
      getFilteredFeeStructures({
        classLevelId: v.classLevelId ? Number(v.classLevelId) : undefined,
        academicYearId: v.academicYearId ? Number(v.academicYearId) : undefined,
        feeType: v.feeType || undefined,
        frequency: v.frequency || undefined,
      }),
    onSuccess: (data) => {
      toast.success(`Found ${data.length} fee structure${data.length === 1 ? "" : "s"}`);
      setResponse(data);
    },
    onError: (err) => {
      const errorMsg = getApiErrorMessage(err, "Failed to fetch filtered fee structures");
      toast.error(errorMsg);
      setResponse({ error: errorMsg });
    },
  });

  const handleSubmit = (v: Values) => {
    setAppliedFilters(v);
    filterMutation.mutate(v);
  };

  const handleReset = () => {
    form.reset();
    setAppliedFilters({});
    setResponse(null);
  };

  const isLoading = 
    classesQuery.isLoading || 
    academicYearsQuery.isLoading || 
    feeTypesQuery.isLoading || 
    frequenciesQuery.isLoading;

  const classes = classesQuery.data ?? [];
  const academicYears = academicYearsQuery.data ?? [];
  const feeTypes = feeTypesQuery.data ?? [];
  const frequencies = frequenciesQuery.data ?? [];

  return (
    <div className="space-y-4">
      {/* Filter Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Filter Fee Structures</h3>
            <p className="text-sm text-muted-foreground">Search for fee structures by class, academic year, type, or frequency</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Class Level Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="classLevelId">Class (Optional)</Label>
                <Select
                  value={form.watch("classLevelId")}
                  onValueChange={(val) => form.setValue("classLevelId", val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="classLevelId">
                    <SelectValue placeholder={isLoading ? "Loading..." : "All classes"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.displayName || cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Year Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="academicYearId">Academic Year (Optional)</Label>
                <Select
                  value={form.watch("academicYearId")}
                  onValueChange={(val) => form.setValue("academicYearId", val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="academicYearId">
                    <SelectValue placeholder={isLoading ? "Loading..." : "All years"} />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={String(year.id)}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fee Type Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="feeType">Fee Type (Optional)</Label>
                <Select
                  value={form.watch("feeType")}
                  onValueChange={(val) => form.setValue("feeType", val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="feeType">
                    <SelectValue placeholder={isLoading ? "Loading..." : "All types"} />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Frequency Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="frequency">Frequency (Optional)</Label>
                <Select
                  value={form.watch("frequency")}
                  onValueChange={(val) => form.setValue("frequency", val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder={isLoading ? "Loading..." : "All frequencies"} />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq.id} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <SubmitButton
                loading={filterMutation.isPending || isLoading}
                className="gap-2"
              >
                <Filter className="h-4 w-4" /> Apply Filters
              </SubmitButton>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Reset
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Results Card */}
      {response && (
        <>
          {Array.isArray(response) && response.length > 0 ? (
            <Card className="p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Found {response.length} fee structure{response.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {response.map((fee: any) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {String(fee.id).slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">{fee.className}</TableCell>
                        <TableCell>{fee.academicYearName || fee.academicYearId}</TableCell>
                        <TableCell>{fee.feeType}</TableCell>
                        <TableCell>{fee.frequency}</TableCell>
                        <TableCell className="font-mono">
                          {typeof fee.amount === 'number' 
                            ? `₹${fee.amount.toFixed(2)}` 
                            : fee.amount}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fee.description || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : response?.error ? (
            <Card className="p-4 border-destructive">
              <h4 className="font-semibold mb-2 text-destructive">Error:</h4>
              <pre className="text-xs overflow-auto max-h-64 p-3 bg-background rounded border border-destructive">
                {typeof response.error === "string"
                  ? response.error
                  : JSON.stringify(response.error, null, 2)}
              </pre>
            </Card>
          ) : (
            <Card className="p-4">
              <EmptyState
                title="No results found"
                description="No fee structures match the selected filters."
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}