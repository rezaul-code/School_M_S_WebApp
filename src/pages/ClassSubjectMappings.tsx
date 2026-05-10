// src/pages/ClassSubjectMappings.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Link2,
  Search,
  Sparkles,
  BookOpen,
  Hash,
  ListFilter,
} from "lucide-react";

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
import Pagination from "@/components/common/Pagination";
import CreateClassSubjectDialog from "@/components/dashboard/CreateClassSubjectDialog";
import { getAllClassSubjects } from "@/lib/api/classSubjects";

import "@/styles/master-data.css";

const ITEMS_PER_PAGE = 10;

export default function ClassSubjectMappings() {
  const [page, setPage] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  const [search, setSearch] = useState("");

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["classSubjectMappings"],
    queryFn: getAllClassSubjects,
  });

  const filtered = mappings.filter(
    (m) =>
      m.className?.toLowerCase().includes(search.toLowerCase()) ||
      m.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      m.subjectCode?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const uniqueClasses = new Set(mappings.map((m) => m.className)).size;
  const uniqueSubjects = new Set(mappings.map((m) => m.subjectName)).size;

  return (
    <div className="md-page">
      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="md-hero md-hero--class-subject">
        <div className="md-hero-glow" />
        <div className="md-hero-inner">
          <div className="md-hero-left">
            <div className="md-hero-icon-wrap">
              <Link2 />
            </div>
            <div className="md-hero-text">
              <h2 className="md-hero-title">Class-Subject Mappings</h2>
              <p className="md-hero-sub">
                Assign subjects to class levels across the curriculum
              </p>
            </div>
          </div>
          <span className="md-hero-badge">
            <Sparkles />
            Master Data
          </span>
        </div>
      </div>

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div className="md-stats">
        <div className="md-stat md-stat--amber">
          <div className="md-stat-icon">
            <Link2 />
          </div>
          <div>
            <div className="md-stat-label">Total Mappings</div>
            <div className="md-stat-value">
              {isLoading ? "—" : mappings.length}
            </div>
          </div>
        </div>
        <div className="md-stat md-stat--violet">
          <div className="md-stat-icon">
            <BookOpen />
          </div>
          <div>
            <div className="md-stat-label">Classes Linked</div>
            <div className="md-stat-value">
              {isLoading ? "—" : uniqueClasses}
            </div>
          </div>
        </div>
        <div className="md-stat md-stat--blue">
          <div className="md-stat-icon">
            <Hash />
          </div>
          <div>
            <div className="md-stat-label">Subjects Linked</div>
            <div className="md-stat-value">
              {isLoading ? "—" : uniqueSubjects}
            </div>
          </div>
        </div>
        <div className="md-stat md-stat--green">
          <div className="md-stat-icon">
            <ListFilter />
          </div>
          <div>
            <div className="md-stat-label">Showing</div>
            <div className="md-stat-value">
              {isLoading ? "—" : filtered.length}
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
              placeholder="Search by class or subject…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
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
            Create Mapping
          </Button>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────── */}
      <div className="md-card">
        <div className="md-card-header md-card-header--amber">
          <div className="md-card-title-group">
            <p className="md-card-title">Class-Subject Mapping Registry</p>
            <p className="md-card-subtitle">
              {isLoading
                ? "Loading…"
                : `${filtered.length} mapping${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="md-table-wrap">
          <Table className="md-table">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[40, 120, 140, 70, 90].map((w, j) => (
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
                  <TableCell colSpan={5}>
                    <div className="md-empty">
                      <Link2 className="md-empty-icon" />
                      <p className="md-empty-title">
                        {search ? "No results found" : "No mappings yet"}
                      </p>
                      <p className="md-empty-desc">
                        {search
                          ? "Try a different search term."
                          : "Create your first class-subject mapping to get started."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((m, idx) => (
                  <TableRow key={m.id}>
                    <TableCell className="md-cell-index">
                      {startIdx + idx + 1}
                    </TableCell>
                    <TableCell>
                      <span className="md-badge md-badge--outline">
                        {m.className}
                      </span>
                    </TableCell>
                    <TableCell className="md-cell-name">
                      {m.subjectName}
                    </TableCell>
                    <TableCell>
                      <span className="md-badge md-badge--code">
                        {m.subjectCode}
                      </span>
                    </TableCell>
                    <TableCell className="md-cell-meta">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
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

      <CreateClassSubjectDialog
        open={openCreate}
        onOpenChange={(val) => setOpenCreate(val)}
      />
    </div>
  );
}