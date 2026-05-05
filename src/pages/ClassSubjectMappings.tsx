import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Link2, Plus, List, Search, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CreateMappingPanel } from "@/components/dashboard/ClassSubjectPanels/CreateMappingPanel";
import { ListMappingsPanel } from "@/components/dashboard/ClassSubjectPanels/ListMappingsPanel";
import { GetMappingPanel } from "@/components/dashboard/ClassSubjectPanels/GetMappingPanel";
import { DeleteMappingPanel } from "@/components/dashboard/ClassSubjectPanels/DeleteMappingPanel";

export default function ClassSubjectMappings() {
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
        <Link2 className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Class-Subject Mappings</h1>
          <p className="text-sm text-muted-foreground">Manage subject assignments to classes</p>
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
          <TabsTrigger value="get" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Get by ID</span>
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-2">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <CreateMappingPanel />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ListMappingsPanel />
        </TabsContent>

        <TabsContent value="get" className="mt-6">
          <GetMappingPanel />
        </TabsContent>

        <TabsContent value="delete" className="mt-6">
          <DeleteMappingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
