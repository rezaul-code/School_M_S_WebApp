import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import CreateClassSectionDialog from "../components/dashboard/CreateClassSectionDialog";
import { listClassSections } from "../lib/api/master";

export default function ClassSections() {
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const { data: sections = [], isLoading } = useQuery({ 
    queryKey: ["class-sections"], 
    queryFn: listClassSections 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class Sections</h1>
          <p className="text-muted-foreground text-sm">Manage the mapping between classes and sections.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Create Class Section
        </Button>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead className="text-right">Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : sections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No class sections found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                sections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium text-primary">
                      {section.displayName || `${section.className} - ${section.sectionName}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{section.className}</Badge>
                    </TableCell>
                    <TableCell>{section.sectionName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {section.academicYearName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{section.studentCount || 0}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Passed explicitly as an arrow function to prevent IntrinsicAttributes Type Error */}
      <CreateClassSectionDialog open={openCreate} onOpenChange={(val) => setOpenCreate(val)} />
    </div>
  );
}