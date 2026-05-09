// src/components/teachers/AssignmentsList.tsx

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";

import ConfirmDialog from "@/components/common/ConfirmDialog";

import {
  removeTeacherAssignment,
  type TeacherAssignment,
} from "@/lib/api/teachers";

import { getApiErrorMessage } from "@/lib/api/client";

import "@/styles/teacher.css";

interface Props {
  teacherId: string;
  assignments: TeacherAssignment[];
  onRemoveSuccess?: () => void;
}

export default function AssignmentsList({ teacherId, assignments, onRemoveSuccess }: Props) {
  const qc = useQueryClient();
  const [removeTarget, setRemoveTarget] = useState<TeacherAssignment | null>(null);

  const removeMutation = useMutation({
    mutationFn: (assignmentId: number) =>
      removeTeacherAssignment(teacherId, assignmentId),
    onSuccess: () => {
      toast.success("Assignment removed");
      qc.invalidateQueries({ queryKey: ["teacher-assignments", teacherId] });
      setRemoveTarget(null);
      onRemoveSuccess?.();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to remove assignment"));
    },
  });

  if (assignments.length === 0) {
    return (
      <div className="tm-empty">
        <p className="tm-empty-title">No assignments found.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {assignments.map((assignment) => (
          <div key={assignment.id} className="tm-assign-card" style={{ borderRadius: "0.625rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
            <div>
              <div className="tm-assign-subject">
                <Badge className="tm-badge-subject">
                  {assignment.subjectCode || "SUBJECT"}
                </Badge>
                <span className="tm-assign-subject-name">{assignment.subjectName}</span>
              </div>
              <div className="tm-assign-meta" style={{ marginTop: "0.3rem" }}>
                <span>Class: {assignment.className}</span>
                {assignment.classSectionName && (
                  <>
                    <span className="tm-assign-meta-sep">•</span>
                    <span>Section: {assignment.classSectionName}</span>
                  </>
                )}
              </div>
            </div>

            <button
              className="tm-icon-btn tm-icon-btn--danger"
              onClick={() => setRemoveTarget(assignment)}
              title="Remove assignment"
            >
              <Trash2 />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove Assignment"
        description={`Remove ${removeTarget?.subjectName || "this assignment"} from teacher?`}
        confirmText="Remove"
        confirmVariant="destructive"
        isLoading={removeMutation.isPending}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) removeMutation.mutate(removeTarget.id);
        }}
      />
    </>
  );
}