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

import "@/styles/master-data.css";

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
  { value: "list",     label: "All Structures", icon: List       },
  { value: "create",   label: "Create New",      icon: Plus       },
  { value: "filtered", label: "Filtered View",   icon: Filter     },
  { value: "update",   label: "Update",          icon: RefreshCw  },
];

export default function FeeStructuresPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromUrl(location.search));

  useEffect(() => {
    setActiveTab(getTabFromUrl(location.search));
  }, [location.search]);

  const handleTabChange = (value: string) => {
    navigate(`/fee-structures?tab=${value}`);
  };

  return (
    <div className="md-page">
      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="md-hero md-hero--fee">
        <div className="md-hero-glow" />
        <div className="md-hero-inner">
          <div className="md-hero-left">
            <div className="md-hero-icon-wrap">
              <CreditCard />
            </div>
            <div className="md-hero-text">
              <h2 className="md-hero-title">Fee Structures</h2>
              <p className="md-hero-sub">
                Manage school fee schedules, categories and amounts
              </p>
            </div>
          </div>
          <span className="md-hero-badge">
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
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/40 border border-border rounded-xl gap-1">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-border data-[state=active]:shadow-sm transition-all"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <div className="md-fee-panel">
            <div className="md-fee-panel-header">
              <div>
                <p className="md-card-title">All Fee Structures</p>
                <p className="md-card-subtitle">Complete list of configured fee structures</p>
              </div>
            </div>
            <ListFeeStructuresPanel />
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-4">
          <div className="md-fee-panel">
            <div className="md-fee-panel-header">
              <div>
                <p className="md-card-title">Create Fee Structure</p>
                <p className="md-card-subtitle">Define a new fee category and amount schedule</p>
              </div>
            </div>
            <CreateFeeStructurePanel />
          </div>
        </TabsContent>

        <TabsContent value="filtered" className="mt-4">
          <div className="md-fee-panel">
            <div className="md-fee-panel-header">
              <div>
                <p className="md-card-title">Filtered View</p>
                <p className="md-card-subtitle">Query fee structures by class, year or category</p>
              </div>
            </div>
            <FilteredFeeStructuresPanel />
          </div>
        </TabsContent>

        <TabsContent value="update" className="mt-4">
          <div className="md-fee-panel">
            <div className="md-fee-panel-header">
              <div>
                <p className="md-card-title">Update Fee Structure</p>
                <p className="md-card-subtitle">Edit an existing fee structure record</p>
              </div>
            </div>
            <UpdateFeeStructurePanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}