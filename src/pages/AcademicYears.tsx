// src/pages/AcademicYears.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Search,
  BookOpen,
  CalendarCheck,
  CalendarX,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreateAcademicYearDialog from "@/components/dashboard/CreateAcademicYearDialog";
import { listAcademicYears } from "@/lib/api/master";

import "@/styles/master-data.css";

export default function AcademicYears() {
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [search, setSearch] = useState("");

  const { data: years = [], isLoading } = useQuery({
    queryKey: ["academic-years"],
    queryFn: listAcademicYears,
  });

  const filtered = years.filter((y) =>
    y.name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = years.filter((y) => y.active).length;
  const inactiveCount = years.length - activeCount;

  return (
    <div className="md-page">
      

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div className="md-stats">
        <div className="md-stat md-stat--blue">
          <div className="md-stat-icon">
            <BookOpen />
          </div>
          <div className="md-stat-label">Total Years</div>
          <div className="md-stat-value">
            {isLoading ? "—" : years.length}
          </div>
        </div>
        <div className="md-stat md-stat--green">
          <div className="md-stat-icon">
            <CalendarCheck />
          </div>
          <div className="md-stat-label">Active</div>
          <div className="md-stat-value">
            {isLoading ? "—" : activeCount}
          </div>
        </div>
        <div className="md-stat md-stat--amber">
          <div className="md-stat-icon">
            <CalendarX />
          </div>
          <div className="md-stat-label">Inactive</div>
          <div className="md-stat-value">
            {isLoading ? "—" : inactiveCount}
          </div>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="md-toolbar">
        <div className="md-toolbar-left">
          <div className="md-search-wrap">
            <Search className="md-search-icon" />
            <Input
              placeholder="Search academic years…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
        <div className="md-toolbar-right">
          <Button
            onClick={() => setOpenCreate(true)}
            className="gap-2 h-9 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Year
          </Button>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────── */}
      <div className="md-card">
        <div className="md-card-header md-card-header--teal">
          <div className="md-card-title-group">
            <p className="md-card-title">All Academic Years</p>
            <p className="md-card-subtitle">
              {isLoading
                ? "Loading…"
                : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="md-table-wrap">
          <Table className="md-table">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <div
                          className="md-skel"
                          style={{
                            height: "14px",
                            width: j === 1 ? "8rem" : j === 4 ? "4rem" : "6rem",
                          }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="md-empty">
                      <CalendarDays className="md-empty-icon" />
                      <p className="md-empty-title">
                        {search ? "No results found" : "No academic years yet"}
                      </p>
                      <p className="md-empty-desc">
                        {search
                          ? "Try a different search term."
                          : "Create your first academic year to get started."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((year, idx) => (
                  <TableRow key={year.id}>
                    <TableCell className="md-cell-index">{idx + 1}</TableCell>
                    <TableCell className="md-cell-name">{year.name}</TableCell>
                    <TableCell className="md-cell-meta">
                      {year.startDate
                        ? format(new Date(year.startDate), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="md-cell-meta">
                      {year.endDate
                        ? format(new Date(year.endDate), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {year.active ? (
                        <span className="md-badge md-badge--active">
                          <CheckCircle2 />
                          Active
                        </span>
                      ) : (
                        <span className="md-badge md-badge--inactive">
                          <XCircle />
                          Inactive
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateAcademicYearDialog
        open={openCreate}
        onOpenChange={(val) => setOpenCreate(val)}
      />
    </div>
  );
}