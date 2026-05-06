import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import AdmissionWizard from "@/components/students/admission/AdmissionWizard";

export default function AdmitStudentDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-5xl p-0 overflow-hidden"
      >
        <div className="h-full flex flex-col bg-background">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Admit Student</SheetTitle>

            <SheetDescription>
              Complete student admission and initial fee payment.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <AdmissionWizard onSuccess={() => onOpenChange(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}