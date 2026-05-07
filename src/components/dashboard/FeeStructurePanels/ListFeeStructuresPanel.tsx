import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingTable from "@/components/common/LoadingTable";
import EmptyState from "@/components/common/EmptyState";

import { getAllFeeStructures } from "@/lib/api/feeStructures";

export function ListFeeStructuresPanel() {
  const feesQuery = useQuery({
    queryKey: ["feeStructures"],
    queryFn: getAllFeeStructures,
  });

  const fees = feesQuery.data ?? [];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {feesQuery.data
              ? `Total: ${fees.length} fee structure${fees.length === 1 ? "" : "s"}`
              : "Loading..."}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => feesQuery.refetch()}
          disabled={feesQuery.isLoading}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </Card>

      {/* Table Card */}
      <Card className="p-4">
        {feesQuery.isLoading ? (
          <LoadingTable cols={7} />
        ) : fees.length === 0 ? (
          <EmptyState
            title="No fee structures found"
            description="No fee structures exist yet. Create one from the Create tab."
          />
        ) : (
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
                {fees.map((fee: any) => (
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
        )}
      </Card>
    </div>
  );
}