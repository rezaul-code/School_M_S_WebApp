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
  const feesQ = useQuery({
    queryKey: ["feeStructures"],
    queryFn: getAllFeeStructures,
  });

  const fees = feesQ.data ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {feesQ.data
              ? `Total: ${fees.length} fee structure${fees.length === 1 ? "" : "s"}`
              : "Loading..."}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => feesQ.refetch()}
          disabled={feesQ.isLoading}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </Card>

      <Card className="p-4">
        {feesQ.isLoading ? (
          <LoadingTable cols={6} />
        ) : fees.length === 0 ? (
          <EmptyState
            title="No fee structures found"
            description="No fee structures exist yet."
          />
        ) : (
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
                {fees.map((fee) => (
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
        )}
      </Card>
    </div>
  );
}
