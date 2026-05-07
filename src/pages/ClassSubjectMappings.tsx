import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/common/Pagination";
import LoadingTable from "@/components/common/LoadingTable";
import CreateClassSubjectDialog from "@/components/dashboard/CreateClassSubjectDialog";
import { getAllClassSubjects } from "@/lib/api/classSubjects";

const ITEMS_PER_PAGE = 10;

export default function ClassSubjectMappings() {
  const [page, setPage] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["classSubjectMappings"],
    queryFn: getAllClassSubjects,
  });

  // Calculate pagination
  const totalItems = mappings.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedItems = mappings.slice(startIdx, endIdx);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class-Subject Mappings</h1>
          <p className="text-muted-foreground text-sm">Manage subject assignments to classes.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Create Mapping
        </Button>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Subject Code</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <LoadingTable rows={6} cols={5} />
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No mappings found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-mono text-xs">{mapping.id}</TableCell>
                    <TableCell className="font-medium">{mapping.className}</TableCell>
                    <TableCell>{mapping.subjectName}</TableCell>
                    <TableCell>{mapping.subjectCode}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {mapping.createdAt ? new Date(mapping.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        )}
      </Card>

      <CreateClassSubjectDialog open={openCreate} onOpenChange={(val) => setOpenCreate(val)} />
    </div>
  );
}