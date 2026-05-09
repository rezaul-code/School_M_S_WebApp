// src/pages/ClassLevels.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  School,
  Search,
  Layers,
  Hash,
  Sparkles,
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
import CreateClassLevelDialog from "@/components/dashboard/CreateClassLevelDialog";
import { getClassLevelOptions } from "@/lib/api/master";

import "@/styles/master-data.css";

const ITEMS_PER_PAGE = 10;

export default function ClassLevels() {
  const [page, setPage] = useState(0);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [search, setSearch] = useState("");

  const { data: classLevels = [], isLoading } = useQuery({
    queryKey: ["class-levels-options"],
    queryFn: getClassLevelOptions,
  });

  // Filter
  const filtered = classLevels.filter(
    (cl) =>
      cl.name?.toLowerCase().includes(search.toLowerCase()) ||
      cl.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div className="md-page">
      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="md-hero md-hero--class">
        <div className="md-hero-glow" />
        <div className="md-hero-inner">
          <div className="md-hero-left">
            <div className="md-hero-icon-wrap">
              <School />
            </div>
            <div className="md-hero-text">
              <h2 className="md-hero-title">Class Levels</h2>
              <p className="md-hero-sub">
                Configure class levels (e.g. Class 1 – 12)
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
        <div className="md-stat md-stat--violet">
          <div className="md-stat-icon">
            <Layers />
          </div>
          <div className="md-stat-label">Total Classes</div>
          <div className="md-stat-value">
            {isLoading ? "—" : classLevels.length}
          </div>
        </div>
        <div className="md-stat md-stat--blue">
          <div className="md-stat-icon">
            <Hash />
          </div>
          <div className="md-stat-label">Showing</div>
          <div className="md-stat-value">
            {isLoading ? "—" : filtered.length}
          </div>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="md-toolbar">
        <div className="md-toolbar-left">
          <div className="md-search-wrap">
            <Search className="md-search-icon" />
            <Input
              placeholder="Search class levels…"
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
            Create Class
          </Button>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────── */}
      <div className="md-card">
        <div className="md-card-header md-card-header--violet">
          <div className="md-card-title-group">
            <p className="md-card-title">Class Level Registry</p>
            <p className="md-card-subtitle">
              {isLoading
                ? "Loading…"
                : `${filtered.length} class level${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="md-table-wrap">
          <Table className="md-table">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Display Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {[40, 120, 140].map((w, j) => (
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
                  <TableCell colSpan={3}>
                    <div className="md-empty">
                      <School className="md-empty-icon" />
                      <p className="md-empty-title">
                        {search ? "No results found" : "No class levels yet"}
                      </p>
                      <p className="md-empty-desc">
                        {search
                          ? "Try adjusting your search."
                          : "Add your first class level to get started."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((level, idx) => (
                  <TableRow key={level.id}>
                    <TableCell className="md-cell-index">
                      {startIdx + idx + 1}
                    </TableCell>
                    <TableCell className="md-cell-name">{level.name}</TableCell>
                    <TableCell className="md-cell-meta">
                      {level.displayName}
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

      <CreateClassLevelDialog
        open={openCreate}
        onOpenChange={(val) => setOpenCreate(val)}
      />
    </div>
  );
}