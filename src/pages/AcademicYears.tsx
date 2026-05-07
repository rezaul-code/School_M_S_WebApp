import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import CreateAcademicYearDialog from "../components/dashboard/CreateAcademicYearDialog";
import { listAcademicYears } from "../lib/api/master";

export default function AcademicYears() {
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const { data: years = [], isLoading } = useQuery({ 
    queryKey: ["academic-years"], 
    queryFn: listAcademicYears 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Years</h1>
          <p className="text-muted-foreground text-sm">Manage academic periods and terms.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Create Academic Year
        </Button>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : years.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No academic years found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                years.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.name}</TableCell>
                    <TableCell>
                      {year.startDate ? format(new Date(year.startDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      {year.endDate ? format(new Date(year.endDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      {year.active ? (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Passed explicitly as an arrow function to prevent IntrinsicAttributes Type Error */}
      <CreateAcademicYearDialog open={openCreate} onOpenChange={(val) => setOpenCreate(val)} />
    </div>
  );
}