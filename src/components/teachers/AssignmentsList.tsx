import { useState } from "react";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { Trash2 } from "lucide-react";

import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import ConfirmDialog from "@/components/common/ConfirmDialog";

import {
  removeTeacherAssignment,
  type TeacherAssignment,
} from "@/lib/api/teachers";

import { getApiErrorMessage } from "@/lib/api/client";

interface Props {
  teacherId: string;
  assignments: TeacherAssignment[];
  onRemoveSuccess?: () => void;
}

export default function AssignmentsList({
  teacherId,
  assignments,
  onRemoveSuccess,
}: Props) {
  const qc = useQueryClient();

  const [removeTarget, setRemoveTarget] =
    useState<TeacherAssignment | null>(
      null
    );

  const removeMutation =
    useMutation({
      mutationFn: (
        assignmentId: number
      ) =>
        removeTeacherAssignment(
          teacherId,
          assignmentId
        ),

      onSuccess: () => {
        toast.success(
          "Assignment removed"
        );

        qc.invalidateQueries({
          queryKey: [
            "teacher-assignments",
            teacherId,
          ],
        });

        setRemoveTarget(null);

        onRemoveSuccess?.();
      },

      onError: (err) => {
        toast.error(
          getApiErrorMessage(
            err,
            "Failed to remove assignment"
          )
        );
      },
    });

  if (
    assignments.length === 0
  ) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        No assignments found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {assignments.map(
          (assignment) => (
            <Card
              key={
                assignment.id
              }
              className="flex items-start justify-between gap-4 p-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {assignment.subjectCode ||
                      "SUBJECT"}
                  </Badge>

                  <span className="font-medium">
                    {
                      assignment.subjectName
                    }
                  </span>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Class:{" "}
                    {
                      assignment.className
                    }
                  </p>

                  <p>
                    Section:{" "}
                    {assignment.classSectionName ||
                      "—"}
                  </p>
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() =>
                  setRemoveTarget(
                    assignment
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          )
        )}
      </div>

      {/* REMOVE CONFIRM */}
      <ConfirmDialog
        open={!!removeTarget}
        title="Remove Assignment"
        description={`Remove ${
          removeTarget?.subjectName ||
          "this assignment"
        } from teacher?`}
        confirmText="Remove"
        confirmVariant="destructive"
        isLoading={
          removeMutation.isPending
        }
        onCancel={() =>
          setRemoveTarget(null)
        }
        onConfirm={() => {
          if (removeTarget) {
            removeMutation.mutate(
              removeTarget.id
            );
          }
        }}
      />
    </>
  );
}