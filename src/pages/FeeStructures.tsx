import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, Plus, List, Edit2, Filter } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CreateFeeStructurePanel } from "@/components/dashboard/FeeStructurePanels/CreateFeeStructurePanel";
import { ListFeeStructuresPanel } from "@/components/dashboard/FeeStructurePanels/ListFeeStructuresPanel";
import { UpdateFeeStructurePanel } from "@/components/dashboard/FeeStructurePanels/UpdateFeeStructurePanel";
import { FilteredFeeStructuresPanel } from "@/components/dashboard/FeeStructurePanels/FilteredFeeStructuresPanel";

export default function FeeStructures() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    return tabParam || "create";
  });

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Fee Structures</h1>
          <p className="text-sm text-muted-foreground">Manage fee structure setup and modifications</p>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List All</span>
          </TabsTrigger>
          <TabsTrigger value="update" className="gap-2">
            <Edit2 className="h-4 w-4" />
            <span className="hidden sm:inline">Update</span>
          </TabsTrigger>
          <TabsTrigger value="filtered" className="gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtered</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <CreateFeeStructurePanel />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ListFeeStructuresPanel />
        </TabsContent>

        <TabsContent value="update" className="mt-6">
          <UpdateFeeStructurePanel />
        </TabsContent>

        <TabsContent value="filtered" className="mt-6">
          <FilteredFeeStructuresPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
