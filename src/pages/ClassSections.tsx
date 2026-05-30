// src/pages/ClassSections.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Network,
  Search,
  Users,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import Pagination from "@/components/common/Pagination";
import CreateClassSectionDialog from "@/components/dashboard/CreateClassSectionDialog";
import { listClassSections, getClassLevelOptions } from "@/lib/api/master";

import "@/styles/master-data.css";

const ITEMS_PER_PAGE = 10;

export default function ClassSections() {
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  // Fetch all class-sections (unfiltered — we filter client-side for search,
  // but pass classLevelId to the API for the class filter)
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["class-sections", selectedClassId],
    queryFn: () =>
      listClassSections(
        selectedClassId !== "all" ? Number(selectedClassId) : undefined
      ),
  });

  // Fetch class level options for the filter dropdown
  const { data: classLevelOptions = [] } = useQuery({
    queryKey: ["class-level-options"],
    queryFn: getClassLevelOptions,
  });

  const filtered = sections.filter(
    (s) =>
      s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      s.className?.toLowerCase().includes(search.toLowerCase()) ||
      s.sectionName?.toLowerCase().includes(search.toLowerCase()) ||
      s.academicYearName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const totalStudents = sections.reduce(
    (sum, s) => sum + (s.studentCount || 0),
    0
  );

  return (
    <div className="md-page">

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div className="md-stats">
        <div className="md-stat md-stat--orange">
          <div className="md-stat-icon">
            <Network />
          </div>
          <div>
            <div className="md-stat-label">Total Mappings</div>
            <div className="md-stat-value">
              {isLoading ? "—" : sections.length}
            </div>
          </div>
        </div>
        <div className="md-stat md-stat--blue">
          <div className="md-stat-icon">
            <BookOpen />
          </div>
          <div>
            <div className="md-stat-label">Showing</div>
            <div className="md-stat-value">
              {isLoading ? "—" : filtered.length}
            </div>
          </div>
        </div>
        <div className="md-stat md-stat--green">
          <div className="md-stat-icon">
            <Users />
          </div>
          <div>
            <div className="md-stat-label">Total Students</div>
            <div className="md-stat-value">
              {isLoading ? "—" : totalStudents}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="md-toolbar">
        <div className="md-toolbar-left">
          <div className="md-search-wrap">
            <Search className="md-search-icon" />
            <Input
              placeholder="Search class sections…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="h-9"
            />
          </div>

          {/* ── Class Filter ── */}
          <Select
            value={selectedClassId}
            onValueChange={(val) => {
              setSelectedClassId(val);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classLevelOptions.map((cl) => (
                <SelectItem key={cl.id} value={String(cl.id)}>
                  {cl.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md-toolbar-right">
          <Button
            onClick={() => setOpenCreate(true)}
            className="gap-2 h-9 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Class Section
          </Button>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────── */}
      <div className="md-card">
        <div className="md-card-header md-card-header--orange">
          <div className="md-card-title-group">
            <p className="md-card-title">Class Section Mappings</p>
            <p className="md-card-subtitle">
              {isLoading
                ? "Loading…"
                : `${filtered.length} mapping${filtered.length !== 1 ? "s" : ""}${selectedClassId !== "all" ? " · filtered by class" : ""}`}
            </p>
          </div>
        </div>

        <div className="md-table-wrap">
          <Table className="md-table">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead style={{ textAlign: "right" }}>Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[40, 130, 100, 80, 110, 50].map((w, j) => (
                      <TableCell key={j}>
                        <div
                          className="md-skel"
                          style={{ height: "14px", width: `${w}px` }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="md-empty">
                      <Network className="md-empty-icon" />
                      <p className="md-empty-title">
                        {search || selectedClassId !== "all"
                          ? "No results found"
                          : "No class sections yet"}
                      </p>
                      <p className="md-empty-desc">
                        {search || selectedClassId !== "all"
                          ? "Try a different search term or class filter."
                          : "Create your first class section mapping to get started."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((section, idx) => (
                  <TableRow key={section.id}>
                    <TableCell className="md-cell-index">
                      {startIdx + idx + 1}
                    </TableCell>
                    <TableCell className="md-cell-name">
                      {section.displayName ||
                        `${section.className} - ${section.sectionName}`}
                    </TableCell>
                    <TableCell>
                      <span className="md-badge md-badge--outline">
                        {section.className}
                      </span>
                    </TableCell>
                    <TableCell className="md-cell-meta">
                      {section.sectionName}
                    </TableCell>
                    <TableCell className="md-cell-meta">
                      {section.academicYearName}
                    </TableCell>
                    <TableCell>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "0.375rem",
                        }}
                        className="md-cell-meta"
                      >
                        <Users style={{ width: "0.8rem", height: "0.8rem" }} />
                        <span>{section.studentCount || 0}</span>
                      </div>
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
      </div>

      <CreateClassSectionDialog
        open={openCreate}
        onOpenChange={(val) => setOpenCreate(val)}
      />
    </div>
  );
}