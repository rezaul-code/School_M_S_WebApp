import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SidebarContent, { getActiveNav } from "./Sidebar";

export default function AppLayout() {
  console.log("AppLayout rendered");
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const active = getActiveNav(location.pathname);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop fixed sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block"
        style={{ boxShadow: "var(--shadow-sidebar)" }}
      >
        <SidebarContent />
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen w-full flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur lg:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex flex-col leading-tight">
            <h1 className="text-base font-semibold">{active.label}</h1>
            <nav className="text-xs text-muted-foreground">
              <span>Home</span>
              <span className="mx-1.5">/</span>
              <span className="text-foreground">{active.label}</span>
            </nav>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
