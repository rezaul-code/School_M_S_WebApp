// src/components/dashboard/FeeStructurePanels/FilteredFeeStructuresPanel.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

import { getFilteredFeeStructures } from "@/lib/api/feeStructures";
import { getClassLevelOptions, listAcademicYears } from "@/lib/api/master";
import { getDropdownOptions } from "@/lib/api/options";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  classLevelId:   z.string().optional(),
  academicYearId: z.string().optional(),
  feeType:        z.string().optional(),
  frequency:      z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function FilteredFeeStructuresPanel() {
  const [results, setResults]         = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const classesQuery       = useQuery({ queryKey: ["filter-panel-classes"],       queryFn: getClassLevelOptions });
  const academicYearsQuery = useQuery({ queryKey: ["filter-panel-academic-years"],queryFn: listAcademicYears });
  const feeTypesQuery      = useQuery({ queryKey: ["filter-panel-fee-types"],     queryFn: () => getDropdownOptions("fee-types") });
  const frequenciesQuery   = useQuery({ queryKey: ["filter-panel-frequencies"],   queryFn: () => getDropdownOptions("fee-frequencies") });

  const classes       = Array.isArray(classesQuery.data)       ? classesQuery.data       : [];
  const academicYears = Array.isArray(academicYearsQuery.data) ? academicYearsQuery.data : [];
  const feeTypes      = Array.isArray(feeTypesQuery.data)      ? feeTypesQuery.data      : [];
  const frequencies   = Array.isArray(frequenciesQuery.data)   ? frequenciesQuery.data   : [];

  const isLoadingDropdowns =
    classesQuery.isLoading ||
    academicYearsQuery.isLoading ||
    feeTypesQuery.isLoading ||
    frequenciesQuery.isLoading;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      classLevelId: "all", academicYearId: "all",
      feeType: "all",      frequency: "all",
    },
  });

  const handleSearch = async (v: Values) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      setHasSearched(true);

      const params = {
        classLevelId:   v.classLevelId   && v.classLevelId   !== "all" ? Number(v.classLevelId)   : undefined,
        academicYearId: v.academicYearId && v.academicYearId !== "all" ? Number(v.academicYearId) : undefined,
        feeType:        v.feeType        && v.feeType        !== "all" ? v.feeType                : undefined,
        frequency:      v.frequency      && v.frequency      !== "all" ? v.frequency              : undefined,
      };

      const data = await getFilteredFeeStructures(params);

      if (Array.isArray(data)) {
        setResults(data);
        toast.success(`Found ${data.length} result(s)`);
      } else {
        setResults([]);
      }
    } catch (error) {
      const msg = getApiErrorMessage(error, "Failed to filter fee structures");
      setSearchError(msg);
      setResults([]);
      toast.error(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    form.reset({ classLevelId: "all", academicYearId: "all", feeType: "all", frequency: "all" });
    setResults([]);
    setHasSearched(false);
    setSearchError(null);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Filter form */}
      <div className="fs-filter-section">
        <div className="fs-section-label">Filter Options</div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleSearch)}
        >
          <div className="fs-grid-4">
            {/* CLASS */}
            <div className="fs-field">
              <Label>Class</Label>
              <Select
                value={form.watch("classLevelId")}
                onValueChange={(val) => form.setValue("classLevelId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={String(cls.id)} value={String(cls.id)}>
                      {cls.displayName || cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* YEAR */}
            <div className="fs-field">
              <Label>Academic Year</Label>
              <Select
                value={form.watch("academicYearId")}
                onValueChange={(val) => form.setValue("academicYearId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((year: any) => (
                    <SelectItem key={String(year.id)} value={String(year.id)}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* FEE TYPE */}
            <div className="fs-field">
              <Label>Fee Type</Label>
              <Select
                value={form.watch("feeType")}
                onValueChange={(val) => form.setValue("feeType", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {feeTypes.map((type: any, index: number) => (
                    <SelectItem key={`${type?.value || type}-${index}`} value={String(type?.value || type)}>
                      {type?.label || type?.value || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* FREQUENCY */}
            <div className="fs-field">
              <Label>Frequency</Label>
              <Select
                value={form.watch("frequency")}
                onValueChange={(val) => form.setValue("frequency", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All frequencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frequencies</SelectItem>
                  {frequencies.map((freq: any, index: number) => (
                    <SelectItem key={`${freq?.value || freq}-${index}`} value={String(freq?.value || freq)}>
                      {freq?.label || freq?.value || freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="fs-filter-actions">
            <SubmitButton
              loading={isSearching || isLoadingDropdowns}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </SubmitButton>

            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* Error banner */}
      {searchError && (
        <div className="fs-error-banner">
          <p>{searchError}</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !searchError && (
        <>
          {results.length > 0 ? (
            <div className="fs-results-card">
              <div className="fs-results-header">
                <span className="fs-results-count">
                  {results.length} result{results.length === 1 ? "" : "s"} found
                </span>
              </div>
              <div className="fs-table-wrap">
                <Table className="fs-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((fee: any) => (
                      <TableRow key={fee.id}>
                        <TableCell className="fs-id-cell">{fee.id}</TableCell>
                        <TableCell>{fee.className}</TableCell>
                        <TableCell>{fee.academicYearName}</TableCell>
                        <TableCell>{fee.feeType}</TableCell>
                        <TableCell>{fee.frequency}</TableCell>
                        <TableCell className="fs-amount-cell">
                          ₹{Number(fee.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="fs-results-card">
              <div className="p-4">
                <EmptyState
                  title="No results found"
                  description="No fee structures matched your filters."
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}