//src/pages/ResultRulesManager.tsx
import { useState } from "react";
import ResultRulesDashboard from "./ResultRulesDashboard";
import ResultRuleWizard from "./ResultRuleSetup";

type ViewState = "DASHBOARD" | "WIZARD";

export default function ResultRulesManager() {
  const [view, setView] = useState<ViewState>("DASHBOARD");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const handleCreateNew = () => {
    setEditingClassId(null); // Open a blank wizard
    setView("WIZARD");
  };

  const handleEditRule = (classId: string) => {
    setEditingClassId(classId); // Open wizard pre-filled with this class
    setView("WIZARD");
  };

  const handleBackToDashboard = () => {
    setEditingClassId(null);
    setView("DASHBOARD");
  };

  return (
    <div className="w-full h-full relative">
      {view === "DASHBOARD" ? (
        <ResultRulesDashboard
          onCreateNew={handleCreateNew}
          onEditRule={handleEditRule}
        />
      ) : (
        <ResultRuleWizard
          initialClassId={editingClassId}
          onClose={handleBackToDashboard}
        />
      )}
    </div>
  );
}