import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CreateFeeStructurePanel } from "@/components/dashboard/FeeStructurePanels/CreateFeeStructurePanel";
import { ListFeeStructuresPanel } from "@/components/dashboard/FeeStructurePanels/ListFeeStructuresPanel";
import { UpdateFeeStructurePanel } from "@/components/dashboard/FeeStructurePanels/UpdateFeeStructurePanel";
import { FilteredFeeStructuresPanel } from "@/components/dashboard/FeeStructurePanels/FilteredFeeStructuresPanel";

export default function FeeStructuresPage() {
const location = useLocation();
const navigate = useNavigate();

const getTabFromUrl = () => {
const params = new URLSearchParams(location.search);

const tab = params.get("tab");

if (
  tab === "create" ||
  tab === "list" ||
  tab === "update" ||
  tab === "filtered"
) {
  return tab;
}

return "list";

};

const [activeTab, setActiveTab] = useState(getTabFromUrl());

useEffect(() => {
setActiveTab(getTabFromUrl());
}, [location.search]);

const handleTabChange = (value: string) => {
setActiveTab(value);

navigate(`/fee-structures?tab=${value}`);


};

return ( <div className="container mx-auto py-8"> <div className="mb-8"> <h1 className="text-4xl font-bold">Fee Structures</h1>

    <p className="text-muted-foreground mt-2">
      Manage school fee structures and schedules
    </p>
  </div>

  <Tabs
    value={activeTab}
    onValueChange={handleTabChange}
    className="w-full"
  >
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="list">
        List All
      </TabsTrigger>

      <TabsTrigger value="create">
        Create
      </TabsTrigger>

      <TabsTrigger value="filtered">
        Filtered
      </TabsTrigger>

      <TabsTrigger value="update">
        Update
      </TabsTrigger>
    </TabsList>

    <TabsContent value="list" className="mt-6">
      <ListFeeStructuresPanel />
    </TabsContent>

    <TabsContent value="create" className="mt-6">
      <CreateFeeStructurePanel />
    </TabsContent>

    <TabsContent value="filtered" className="mt-6">
      <FilteredFeeStructuresPanel />
    </TabsContent>

    <TabsContent value="update" className="mt-6">
      <UpdateFeeStructurePanel />
    </TabsContent>
  </Tabs>
</div>


);
}
