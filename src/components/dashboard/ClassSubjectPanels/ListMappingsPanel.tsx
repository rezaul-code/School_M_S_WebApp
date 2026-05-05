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

import { getAllClassSubjects } from "@/lib/api/classSubjects";

export function ListMappingsPanel() {
  const mappingsQ = useQuery({
    queryKey: ["classSubjectMappings"],
    queryFn: getAllClassSubjects,
  });

  const mappings = mappingsQ.data ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {mappingsQ.data
              ? `Total: ${mappings.length} mapping${mappings.length === 1 ? "" : "s"}`
              : "Loading..."}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mappingsQ.refetch()}
          disabled={mappingsQ.isLoading}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </Card>

      <Card className="p-4">
        {mappingsQ.isLoading ? (
          <LoadingTable cols={4} />
        ) : mappings.length === 0 ? (
          <EmptyState
            title="No mappings found"
            description="No class-subject mappings exist yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Subject ID</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {String(m.id).slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">{m.className}</TableCell>
                    <TableCell>{m.subject?.name || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.subjectId}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString()
                        : "—"}
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
