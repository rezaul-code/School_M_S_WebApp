// src/components/layout/AppLayout.tsx

import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import SidebarContent, {
  navItems,
  teacherItems,
  masterDataItems,
  studentItems,
  reportingItems,
  accountingItems,
} from "@/components/layout/Sidebar";

import "@/styles/teacher.css";
import "@/styles/master-data.css";
import "@/styles/report.css";
import "@/styles/accounting.css";

/* =========================================================
   CONSTANTS
========================================================= */

const SIDEBAR_EXPANDED_W  = 288; // px  →  w-72
const SIDEBAR_COLLAPSED_W =  64; // px  →  w-16

/* =========================================================
   HELPERS
========================================================= */

interface NavItem {
  to: string;
  label: string;
  icon?: any;
}

function getActiveNav(pathname: string): NavItem {
  const allItems: NavItem[] = [
    ...navItems,
    ...studentItems,
    ...teacherItems,
    ...masterDataItems,
    { to: "/fee-structures", label: "Fee Structures" },
    ...reportingItems,
    ...accountingItems,
  ];

  if (pathname === "/students/admit")    return { to: "/students/admit",    label: "Admit Student" };
  if (pathname === "/students/id-cards") return { to: "/students/id-cards", label: "ID Cards"      };

  return (
    allItems.find(
      (n) => pathname === n.to || pathname.startsWith(n.to + "/")
    ) ?? navItems[0]
  );
}

/* =========================================================
   LAYOUT
========================================================= */

export default function AppLayout() {
  const [mobileOpen,       setMobileOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Track whether we're on a desktop (lg+) breakpoint.
  // paddingLeft should only apply when the sidebar is actually visible (lg+).
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const location = useLocation();
  const active   = getActiveNav(location.pathname);

  const toggleCollapse = () => setSidebarCollapsed((prev) => !prev);

  // Sidebar pixel width drives the <aside> and the main content offset
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  return (
    <div className="flex min-h-screen w-full" style={{ background: "hsl(220 14% 88%)" }}>

      {/* ── Desktop Sidebar ───────────────────────────── */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar lg:block overflow-hidden"
        style={{
          width:      sidebarWidth,
          transition: "width 300ms ease-in-out",
          boxShadow:  "var(--shadow-sidebar)",
        }}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* ── Main area ─────────────────────────────────────
          paddingLeft only applied on desktop (lg+) where the
          sidebar is actually rendered. On mobile/tablet the
          sidebar is in a Sheet drawer, so no offset is needed.
      ─────────────────────────────────────────────────── */}
      <div
        className="flex min-h-screen w-full flex-col"
        style={
          isDesktop
            ? { paddingLeft: sidebarWidth, transition: "padding-left 300ms ease-in-out" }
            : undefined
        }
      >
        {/* ── Top header ──────────────────────────────── */}
        <header className="tm-header sticky top-0 z-20 flex h-16 items-center gap-4 px-4 lg:px-6">

          {/* Mobile hamburger — opens Sheet drawer, only visible below lg */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
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
              {/* Mobile sidebar is always "expanded" — collapse has no meaning inside a Sheet */}
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Page breadcrumb */}
          <div className="flex flex-col leading-tight">
            <h1 className="text-lg font-semibold tracking-tight">
              {active.label}
            </h1>
            <nav className="text-xs text-muted-foreground">
              <span>Home</span>
              <span className="mx-1.5 opacity-50">/</span>
              <span style={{ color: "hsl(38 100% 50%)" }}>{active.label}</span>
            </nav>
          </div>
        </header>

        {/* ── Page content ────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}