// src/pages/Sections.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Layers,
  Search,
  Hash,
  Sparkles,
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
import CreateSectionDialog from "@/components/dashboard/CreateSectionDialog";
import { getSectionOptions } from "@/lib/api/master";

import "@/styles/master-data.css";

const ITEMS_PER_PAGE = 10;

export default function Sections() {
  const [page, setPage] = useState(0);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [search, setSearch] = useState("");

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["sections-options"],
    queryFn: getSectionOptions,
  });

  const filtered = sections.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div className="md-page">
      

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div className="md-stats">
        <div className="md-stat md-stat--teal">
          <div className="md-stat-icon">
            <Layers />
          </div>
          <div>
            <div className="md-stat-label">Total Sections</div>
            <div className="md-stat-value">
              {isLoading ? "—" : sections.length}
            </div>
          </div>
        </div>
        <div className="md-stat md-stat--blue">
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
        <div className="md-stat md-stat--violet">
          <div className="md-stat-icon">
            <Hash />
          </div>
          <div>
            <div className="md-stat-label">Current Page</div>
            <div className="md-stat-value">
              {isLoading ? "—" : paginatedItems.length}
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
              placeholder="Search sections…"
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
            Create Section
          </Button>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────── */}
      <div className="md-card">
        <div className="md-card-header md-card-header--green">
          <div className="md-card-title-group">
            <p className="md-card-title">Section Registry</p>
            <p className="md-card-subtitle">
              {isLoading
                ? "Loading…"
                : `${filtered.length} section${filtered.length !== 1 ? "s" : ""}`}
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
                    {[40, 100, 140].map((w, j) => (
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
                      <Layers className="md-empty-icon" />
                      <p className="md-empty-title">
                        {search ? "No results found" : "No sections yet"}
                      </p>
                      <p className="md-empty-desc">
                        {search
                          ? "Try a different search term."
                          : "Create your first section to get started."}
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
                    <TableCell className="md-cell-name">{section.name}</TableCell>
                    <TableCell className="md-cell-meta">
                      {section.displayName}
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

      <CreateSectionDialog
        open={openCreate}
        onOpenChange={(val) => setOpenCreate(val)}
      />
    </div>
  );
}