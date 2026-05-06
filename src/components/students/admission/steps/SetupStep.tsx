import { useQuery } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

import { getFormOptions } from "@/lib/api/students";

export default function SetupStep({
  state,
  setState,
}: any) {
  const formOptionsQuery = useQuery({
    queryKey: ["student-form-options"],
    queryFn: getFormOptions,
  });

  const academicYears =
    (formOptionsQuery.data as any)?.academicYears ?? [];

  const classSections =
    (formOptionsQuery.data as any)?.classSections ?? [];

  const filteredSections = classSections.filter(
    (s: any) =>
      String(s.academicYearId) ===
      String(state.setupData.academicYearId)
  );

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-xl font-semibold">
          Setup
        </h2>

        <p className="text-sm text-muted-foreground">
          Select academic year and class section.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Academic Year</Label>

          <Select
            value={String(state.setupData.academicYearId ?? "")}
            onValueChange={(value) => {
              const year = academicYears.find(
                (a: any) => String(a.id) === value
              );

              setState((prev: any) => ({
                ...prev,

                setupData: {
                  academicYearId: Number(value),
                  academicYearName: year?.name,
                  classSectionId: null,
                },
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>

            <SelectContent>
              {academicYears.map((year: any) => (
                <SelectItem
                  key={year.id}
                  value={String(year.id)}
                >
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Class Section</Label>

          <Select
            value={String(state.setupData.classSectionId ?? "")}
            onValueChange={(value) => {
              const section = filteredSections.find(
                (s: any) => String(s.id) === value
              );

              setState((prev: any) => ({
                ...prev,

                setupData: {
                  ...prev.setupData,
                  classSectionId: Number(value),

                  classSectionName: `${section?.className} - ${section?.sectionName}`,
                },
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class section" />
            </SelectTrigger>

            <SelectContent>
              {filteredSections.map((section: any) => (
                <SelectItem
                  key={section.id}
                  value={String(section.id)}
                >
                  {section.className?.replaceAll("_", " ")} -{" "}
                  {section.sectionName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}