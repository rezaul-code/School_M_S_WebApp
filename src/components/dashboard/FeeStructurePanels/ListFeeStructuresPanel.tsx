// src/components/dashboard/FeeStructurePanels/ListFeeStructuresPanel.tsx

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
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
    queryKey: ["list-fee-structures-panel-isolated"],
    queryFn: getAllFeeStructures,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });

  const fees =
    feesQuery.data && Array.isArray(feesQuery.data) ? feesQuery.data : [];

  return (
    <div className="space-y-4 w-full">
      {/* Toolbar */}
      <div className="fs-table-card">
        <div className="fs-table-toolbar">
          <span className="fs-table-count">
            {feesQuery.isSuccess
              ? `Total: ${fees.length} fee structure${fees.length === 1 ? "" : "s"}`
              : feesQuery.isLoading
              ? "Loading…"
              : "Error loading"}
          </span>

          <button
            className="fs-refresh-btn"
            onClick={() => feesQuery.refetch()}
            disabled={feesQuery.isLoading}
          >
            <RefreshCw />
            Refresh
          </button>
        </div>

        {/* Table */}
        {feesQuery.isLoading ? (
          <div className="p-4">
            <LoadingTable cols={7} />
          </div>
        ) : feesQuery.isError ? (
          <div className="text-center py-10 px-4">
            <p className="text-sm font-medium" style={{ color: "hsl(var(--destructive))" }}>
              Failed to load fee structures
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              Please try refreshing
            </p>
          </div>
        ) : !fees || fees.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No fee structures found"
              description="No fee structures exist yet. Create one from the Create tab."
            />
          </div>
        ) : (
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
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee?.id ?? Math.random()}>
                    <TableCell className="fs-id-cell">
                      {String(fee?.id ?? "—").slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {fee?.className ?? "—"}
                    </TableCell>
                    <TableCell>
                      {fee?.academicYearName ?? fee?.academicYearId ?? "—"}
                    </TableCell>
                    <TableCell>{fee?.feeType ?? "—"}</TableCell>
                    <TableCell>{fee?.frequency ?? "—"}</TableCell>
                    <TableCell className="fs-amount-cell">
                      {typeof fee?.amount === "number"
                        ? `₹${fee.amount.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="fs-desc-cell">
                      {fee?.description ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}