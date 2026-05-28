// src/pages/ExamTypes.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Award, Search, Sparkles, ShieldCheck, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/common/Pagination";
import CreateExamTypeDialog from "@/components/dashboard/CreateExamTypeDialog";
import { getAllExamTypes } from "@/lib/api/exams";

import "@/styles/master-data.css";

const ITEMS_PER_PAGE = 10;

export default function ExamTypes() {
  const [page, setPage] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  const [search, setSearch] = useState("");

  const { data: examTypes = [], isLoading } = useQuery({
    queryKey: ["examTypes"],
    queryFn: getAllExamTypes,
  });

  const filtered = examTypes.filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.code?.toLowerCase().includes(search.toLowerCase()) ||
      e.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div className="md-page">
      

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div className="md-stats">
        <div className="md-stat md-stat--amber">
          <div className="md-stat-icon"><Award /></div>
          <div>
            <div className="md-stat-label">Total Categories</div>
            <div className="md-stat-value">{isLoading ? "—" : examTypes.length}</div>
          </div>
        </div>
        <div className="md-stat md-stat--blue">
          <div className="md-stat-icon"><ShieldCheck /></div>
          <div>
            <div className="md-stat-label">Active Schemes</div>
            <div className="md-stat-value">{isLoading ? "—" : new Set(examTypes.map(e => e.category)).size}</div>
          </div>
        </div>
        <div className="md-stat md-stat--green">
          <div className="md-stat-icon"><Tag /></div>
          <div>
            <div className="md-stat-label">Showing Match</div>
            <div className="md-stat-value">{isLoading ? "—" : filtered.length}</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="md-toolbar">
        <div className="md-toolbar-left">
          <div className="md-search-wrap">
            <Search className="md-search-icon" />
            <Input
              placeholder="Search by category name or tracking code…"
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
          <Button onClick={() => setOpenCreate(true)} className="gap-2 h-9 text-sm">
            <Plus className="h-4 w-4" />
            Create Exam Type
          </Button>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────── */}
      <div className="md-card">
        <div className="md-card-header md-card-header--amber">
          <div className="md-card-title-group">
            <p className="md-card-title">Exam Type Registry Master Blueprint</p>
            <p className="md-card-subtitle">
              {isLoading ? "Loading..." : `${filtered.length} format row entries linked`}
            </p>
          </div>
        </div>

        <div className="md-table-wrap">
          <Table className="md-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead className="w-[180px]">Code Registry Key</TableHead>
                <TableHead className="w-[240px]">Display Label Name</TableHead>
                <TableHead className="w-[140px]">Evaluation Format</TableHead>
                <TableHead>Description Parameters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[40, 140, 180, 100, 260].map((w, j) => (
                      <TableCell key={j}>
                        <div className="md-skel" style={{ height: "14px", width: `${w}px` }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="md-empty">
                      <Award className="md-empty-icon" />
                      <p className="md-empty-title">
                        {search ? "No filtered results found" : "No blueprints established yet"}
                      </p>
                      <p className="md-empty-desc">
                        {search ? "Refine your filtering keywords." : "Register the first master exam type to launch your system schemas."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((exam, idx) => (
                  <TableRow key={exam.id}>
                    <TableCell className="md-cell-index">{startIdx + idx + 1}</TableCell>
                    <TableCell>
                      <span className="md-badge md-badge--code font-mono text-[11px]">
                        {exam.code}
                      </span>
                    </TableCell>
                    <TableCell className="md-cell-name font-medium">{exam.name}</TableCell>
                    <TableCell>
                      <span className={`md-badge ${exam.category === 'WRITTEN' ? 'md-badge--outline' : 'md-badge--secondary'}`}>
                        {exam.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{exam.description || "—"}</TableCell>
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

      <CreateExamTypeDialog open={openCreate} onOpenChange={setOpenCreate} />
    </div>
  );
}