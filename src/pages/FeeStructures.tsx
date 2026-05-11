// src/pages/FeeStructures.tsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  List,
  Plus,
  Filter,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateFeeStructurePanel } from "@/components/dashboard/FeeStructurePanels/CreateFeeStructurePanel";
import { ListFeeStructuresPanel } from "@/components/dashboard/FeeStructurePanels/ListFeeStructuresPanel";
import { UpdateFeeStructurePanel } from "@/components/dashboard/FeeStructurePanels/UpdateFeeStructurePanel";
import { FilteredFeeStructuresPanel } from "@/components/dashboard/FeeStructurePanels/FilteredFeeStructuresPanel";

import "@/styles/fee-structure.css";

type Tab = "list" | "create" | "filtered" | "update";

function getTabFromUrl(search: string): Tab {
  const params = new URLSearchParams(search);
  const tab = params.get("tab") as Tab | null;
  return tab && ["list", "create", "filtered", "update"].includes(tab)
    ? tab
    : "list";
}

const TAB_CONFIG: {
  value: Tab;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "list",     label: "All Structures", icon: List      },
  { value: "create",   label: "Create New",      icon: Plus      },
  { value: "filtered", label: "Filtered View",   icon: Filter    },
  { value: "update",   label: "Update",          icon: RefreshCw },
];

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
  list:     { title: "All Fee Structures",   subtitle: "Complete list of configured fee structures" },
  create:   { title: "Create Fee Structure", subtitle: "Define a new fee category and amount schedule" },
  filtered: { title: "Filtered View",        subtitle: "Query fee structures by class, year or category" },
  update:   { title: "Update Fee Structure", subtitle: "Edit an existing fee structure record" },
};

export default function FeeStructuresPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromUrl(location.search));

  useEffect(() => {
    setActiveTab(getTabFromUrl(location.search));
  }, [location.search]);

  const handleTabChange = (value: string) => {
    navigate(`/fee-structures?tab=${value}`);
  };

  const meta = TAB_META[activeTab];

  return (
    <div className="fs-page">

      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="fs-hero">
        <div className="fs-hero-glow" />
        <div className="fs-hero-inner">
          <div className="fs-hero-left">
            <div className="fs-hero-icon-wrap">
              <CreditCard />
            </div>
            <div className="fs-hero-text">
              <h2 className="fs-hero-title">Fee Structures</h2>
              <p className="fs-hero-sub">
                Manage school fee schedules, categories and amounts
              </p>
            </div>
          </div>
          <span className="fs-hero-badge">
            <Sparkles />
            Master Data
          </span>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="fs-tabs-list">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="fs-tab-trigger"
            >
              <Icon />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── List ─────────────────────────────────────── */}
        <TabsContent value="list" className="mt-4">
          <div className="fs-panel">
            <div className="fs-panel-header">
              <div>
                <p className="fs-panel-title">{TAB_META.list.title}</p>
                <p className="fs-panel-subtitle">{TAB_META.list.subtitle}</p>
              </div>
            </div>
            <div className="fs-panel-body">
              <ListFeeStructuresPanel />
            </div>
          </div>
        </TabsContent>

        {/* ── Create ───────────────────────────────────── */}
        <TabsContent value="create" className="mt-4">
          <div className="fs-panel">
            <div className="fs-panel-header">
              <div>
                <p className="fs-panel-title">{TAB_META.create.title}</p>
                <p className="fs-panel-subtitle">{TAB_META.create.subtitle}</p>
              </div>
            </div>
            <div className="fs-panel-body">
              <CreateFeeStructurePanel />
            </div>
          </div>
        </TabsContent>

        {/* ── Filtered ─────────────────────────────────── */}
        <TabsContent value="filtered" className="mt-4">
          <div className="fs-panel">
            <div className="fs-panel-header">
              <div>
                <p className="fs-panel-title">{TAB_META.filtered.title}</p>
                <p className="fs-panel-subtitle">{TAB_META.filtered.subtitle}</p>
              </div>
            </div>
            <div className="fs-panel-body">
              <FilteredFeeStructuresPanel />
            </div>
          </div>
        </TabsContent>

        {/* ── Update ───────────────────────────────────── */}
        <TabsContent value="update" className="mt-4">
          <div className="fs-panel">
            <div className="fs-panel-header">
              <div>
                <p className="fs-panel-title">{TAB_META.update.title}</p>
                <p className="fs-panel-subtitle">{TAB_META.update.subtitle}</p>
              </div>
            </div>
            <div className="fs-panel-body">
              <UpdateFeeStructurePanel />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}