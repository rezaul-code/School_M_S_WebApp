import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import Pagination from "../components/common/Pagination";
import LoadingTable from "../components/common/LoadingTable";
import CreateClassLevelDialog from "../components/dashboard/CreateClassLevelDialog";
import { getClassLevelOptions } from "../lib/api/master";

const ITEMS_PER_PAGE = 10;

export default function ClassLevels() {
  const [page, setPage] = useState(0);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  
  const { data: classLevels = [], isLoading } = useQuery({
    queryKey: ["class-levels-options"],
    queryFn: getClassLevelOptions,
  });

  // Calculate pagination
  const totalItems = classLevels.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedItems = classLevels.slice(startIdx, endIdx);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class Levels</h1>
          <p className="text-muted-foreground text-sm">Manage class levels (e.g., Class 1-12).</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Create Class Level
        </Button>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Display Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <LoadingTable rows={6} cols={2} />
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    No class levels found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="font-medium">{level.name}</TableCell>
                    <TableCell>{level.displayName}</TableCell>
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

      <CreateClassLevelDialog open={openCreate} onOpenChange={(val) => setOpenCreate(val)} />
    </div>
  );
}