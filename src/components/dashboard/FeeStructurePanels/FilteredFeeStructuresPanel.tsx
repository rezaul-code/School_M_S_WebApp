import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Filter } from "lucide-react";

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

import { getFilteredFeeStructures } from "@/lib/api/feeStructures";
import { CLASS_OPTIONS } from "@/lib/api/master";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  className: z.string().optional(),
  academicYearId: z.string().optional().refine(
    (val) => !val || !isNaN(Number(val)),
    "Academic Year ID must be a number"
  ),
});
type Values = z.infer<typeof schema>;

export function FilteredFeeStructuresPanel() {
  const [response, setResponse] = useState<any>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      className: "",
      academicYearId: "",
    },
  });

  const filterMutation = useMutation({
    mutationFn: (v: Values) =>
      getFilteredFeeStructures({
        className: v.className || undefined,
        academicYearId: v.academicYearId ? Number(v.academicYearId) : undefined,
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

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Filtered Fee Structures</h3>
            <p className="text-sm text-muted-foreground">Filter fee structures by class and/or academic year</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) => filterMutation.mutate(v))}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="className">Class Name (Optional)</Label>
                <Select
                  value={form.watch("className")}
                  onValueChange={(val) => form.setValue("className", val)}
                >
                  <SelectTrigger id="className">
                    <SelectValue placeholder="Select class (all if empty)" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="academicYearId">Academic Year ID (Optional)</Label>
                <Input
                  id="academicYearId"
                  type="number"
                  placeholder="Enter academic year ID"
                  {...form.register("academicYearId")}
                />
                {form.formState.errors.academicYearId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.academicYearId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <SubmitButton
                loading={filterMutation.isPending}
                className="gap-2"
              >
                <Filter className="h-4 w-4" /> Fetch Filtered Results
              </SubmitButton>
            </div>
          </form>
        </div>
      </Card>

      {response && (
        <>
          {Array.isArray(response) && response.length > 0 ? (
            <Card className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Academic Year ID</TableHead>
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
                        <TableCell>{fee.academicYearId}</TableCell>
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
