// src/components/layout/AppLayout.tsx

import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import SidebarContent, {
  navItems,
  teacherItems,
  masterDataItems,
  studentItems,
} from "@/components/layout/Sidebar";

import "@/styles/teacher.css";
import "@/styles/master-data.css";

interface NavItem {
  to: string;
  label: string;
  icon?: any;
}

function getActiveNav(pathname: string): NavItem {
  const allItems: NavItem[] = [
    ...navItems,
    ...teacherItems,
    ...masterDataItems,
    ...studentItems,
    {
      to: "/fee-structures",
      label: "Fee Structures",
    },
  ];

  return (
    allItems.find(
      (n) =>
        pathname === n.to ||
        pathname.startsWith(n.to + "/")
    ) ?? navItems[0]
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);

  const location = useLocation();

  const active = getActiveNav(location.pathname);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sidebar-border bg-sidebar lg:block"
        style={{
          boxShadow: "var(--shadow-sidebar)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Main Layout */}
      <div className="flex min-h-screen w-full flex-col lg:pl-72">
        {/* Header — styled via tm-header to match sidebar */}
        <header className="tm-header sticky top-0 z-20 flex h-16 items-center gap-4 px-4 lg:px-6">
          {/* Mobile Sidebar */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-72 border-sidebar-border bg-sidebar p-0"
            >
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Page Info */}
          <div className="flex flex-col leading-tight">
            <h1 className="text-lg font-semibold tracking-tight">
              {active.label}
            </h1>

            <nav className="text-xs text-muted-foreground">
              <span>Home</span>
              <span className="mx-1.5 opacity-50">/</span>
              <span className="text-foreground">{active.label}</span>
            </nav>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}