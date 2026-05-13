// src/components/layout/Sidebar.tsx

import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  Home,
  GraduationCap,
  Users,
  BookOpen,
  LogOut,
  GraduationCap as Logo,
  Link2,
  CreditCard,
  ChevronDown,
  Database,
  CalendarDays,
  School,
  Layers,
  Network,
  UserPlus,
  ClipboardList,
  BarChart2,
  ReceiptText,
  Wallet,
  BookMarked,
  IdCard, // <--- ADDED IDCARD IMPORT HERE
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout, getCurrentUser } from "@/lib/api/auth";

/* =========================================================
   NAV ITEM DEFINITIONS
   `exact: true`  → only pathname === to qualifies as active
   default        → pathname === to OR starts with to + "/"
========================================================= */

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
];

export const studentItems = [
  { to: "/students",       label: "Student List",  icon: GraduationCap, exact: true  },
  { to: "/students/admit", label: "Admit Student", icon: UserPlus,      exact: false },
  { to: "/id-cards",       label: "ID Cards",      icon: IdCard,        exact: false }, // <--- ADDED ID CARDS LINK HERE
];

export const teacherItems = [
  { to: "/teachers/register",            label: "Register Teacher",    icon: UserPlus,      exact: false },
  { to: "/teachers",                     label: "Teacher List",        icon: Users,         exact: true  },
  { to: "/teachers/assignments",         label: "Teacher Assignments", icon: ClipboardList, exact: false },
  { to: "/teachers/subject-assignments", label: "Subject Assignments", icon: BookOpen,      exact: false },
];

export const masterDataItems = [
  { to: "/academic-years",         label: "Academic Year", icon: CalendarDays, exact: false },
  { to: "/class-levels",           label: "Class",         icon: School,       exact: false },
  { to: "/sections",               label: "Sections",      icon: Layers,       exact: false },
  { to: "/class-sections",         label: "Class-Section", icon: Network,      exact: false },
  { to: "/subjects",               label: "Subjects",      icon: BookOpen,     exact: true  },
  { to: "/class-subject-mappings", label: "Class-Subject", icon: Link2,        exact: false },
];

// Fee structures are tab-based; each item targets a query-param tab.
// STANDALONE section — entirely separate from Master Data.
export const feeStructureSubItems = [
  { tabKey: "list",     to: "/fee-structures?tab=list",     label: "List Fee Structures"     },
  { tabKey: "create",   to: "/fee-structures?tab=create",   label: "Create Fee Structure"    },
  { tabKey: "filtered", to: "/fee-structures?tab=filtered", label: "Filtered Fee Structures" },
  { tabKey: "update",   to: "/fee-structures?tab=update",   label: "Update Fee Structure"    },
];

// Reporting — standalone section
export const reportingItems = [
  { to: "/reports/fees", label: "Fee Report", icon: ReceiptText, exact: false },
];

// Accounting — standalone section
export const accountingItems = [
  { to: "/accounting/fee-collections", label: "Fee Collections", icon: Wallet, exact: false },
];

/* =========================================================
   ACTIVE MATCHING — fully isolated per route family
========================================================= */

/**
 * Safe active check with trailing-slash guard.
 * Prevents "/subjects" matching "/class-subject-mappings",
 * and "/class-levels" matching "/class-sections".
 */
function isRouteActive(pathname: string, to: string, exact: boolean): boolean {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(to + "/");
}

/**
 * Fee Structures tab active check — completely isolated.
 * Only fires when pathname is exactly "/fee-structures".
 * Can NEVER accidentally match any Master Data route.
 */
function isFeeTabActive(pathname: string, search: string, tabKey: string): boolean {
  if (pathname !== "/fee-structures") return false;
  return new URLSearchParams(search).get("tab") === tabKey;
}

// Used to compute which section is open on first render
const anyActive = (
  items: { to: string; exact: boolean }[],
  pathname: string
) => items.some((item) => isRouteActive(pathname, item.to, item.exact));

/* =========================================================
   SIDEBAR COMPONENT
========================================================= */

export default function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const navigate  = useNavigate();

  let user = null;
  try { user = getCurrentUser(); } catch { user = null; }

  // Compute initial open section — each family checked independently.
  const initialSection = (() => {
    const p = location.pathname;
    if (anyActive(studentItems, p))    return "students";
    if (anyActive(teacherItems, p))    return "teachers";
    if (anyActive(masterDataItems, p)) return "master-data";   // ONLY master-data routes
    if (p === "/fee-structures")       return "fee-structures"; // ONLY fee route
    if (anyActive(reportingItems, p))  return "reporting";
    if (anyActive(accountingItems, p)) return "accounting";
    return null;
  })();

  const [expandedSection, setExpandedSection] = useState<string | null>(
    initialSection
  );

  const toggle = (key: string) =>
    setExpandedSection((prev) => (prev === key ? null : key));

  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") ||
    user?.email?.[0]?.toUpperCase() ||
    "A";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground backdrop-blur-xl">

      {/* ── Logo / brand ─────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-sidebar-border/70 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Logo className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide">School Admin</div>
          <div className="text-xs text-muted-foreground">Management Panel</div>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">

        {/* 1. Dashboard — flat top-level link */}
        {navItems.map((item) => {
          const Icon   = item.icon;
          const active = isRouteActive(location.pathname, item.to, false);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-all duration-200 ease-out",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border/60 shadow-sm"
                  : "text-sidebar-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* 2. Students ─────────────────────────────────── */}
        <SidebarSection
          title="Students"
          icon={GraduationCap}
          sectionKey="students"
          expanded={expandedSection === "students"}
          onToggle={toggle}
        >
          {studentItems.map((item) => (
            <SidebarSubItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 3. Teachers ─────────────────────────────────── */}
        <SidebarSection
          title="Teachers"
          icon={Users}
          sectionKey="teachers"
          expanded={expandedSection === "teachers"}
          onToggle={toggle}
        >
          {teacherItems.map((item) => (
            <SidebarSubItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 4. Master Data Setup ─────────────────────────── */}
        <SidebarSection
          title="Master Data Setup"
          icon={Database}
          sectionKey="master-data"
          expanded={expandedSection === "master-data"}
          onToggle={toggle}
        >
          {masterDataItems.map((item) => (
            <SidebarSubItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 5. Fee Structures — STANDALONE, NOT part of Master Data ── */}
        <SidebarSection
          title="Fee Structures"
          icon={CreditCard}
          sectionKey="fee-structures"
          expanded={expandedSection === "fee-structures"}
          onToggle={toggle}
        >
          {feeStructureSubItems.map((item) => (
            <SidebarSubItem
              key={item.tabKey}
              to={item.to}
              label={item.label}
              active={isFeeTabActive(
                location.pathname,
                location.search,
                item.tabKey
              )}
              onNavigate={onNavigate}
              // No icon → dot indicator distinguishes tab-based pages from route-based ones
            />
          ))}
        </SidebarSection>

        {/* 6. Reporting — STANDALONE section ──────────── */}
        <SidebarSection
          title="Reporting"
          icon={BarChart2}
          sectionKey="reporting"
          expanded={expandedSection === "reporting"}
          onToggle={toggle}
        >
          {reportingItems.map((item) => (
            <SidebarSubItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 7. Accounting — STANDALONE section ─────────── */}
        <SidebarSection
          title="Accounting"
          icon={BookMarked}
          sectionKey="accounting"
          expanded={expandedSection === "accounting"}
          onToggle={toggle}
        >
          {accountingItems.map((item) => (
            <SidebarSubItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

      </nav>

      {/* ── User footer ──────────────────────────────────── */}
      <div className="border-t border-sidebar-border/70 bg-black/10 p-3 backdrop-blur">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar className="h-10 w-10 border border-sidebar-border/60">
            <AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">
              {initials.toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {user?.firstName
                ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                : "Administrator"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user?.email ?? "admin"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Logout"
            className="rounded-lg hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

    </div>
  );
}

/* =========================================================
   SECTION COMPONENT
   Fully typed. Receives sectionKey so the single `toggle`
   handler manages all sections without prop drilling.
========================================================= */

interface SidebarSectionProps {
  title: string;
  icon: React.ElementType;
  sectionKey: string;
  expanded: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}

function SidebarSection({
  title,
  icon: Icon,
  sectionKey,
  expanded,
  onToggle,
  children,
}: SidebarSectionProps) {
  return (
    <div className="space-y-1 pt-2">
      <button
        onClick={() => onToggle(sectionKey)}
        className={cn(
          "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5",
          "text-sm font-medium transition-all duration-200 ease-out",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          expanded
            ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border/60 shadow-sm"
            : "text-sidebar-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-4 w-4", expanded && "text-primary")} />
          <span>{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-0.5 pl-6 pt-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUB ITEM COMPONENT
   Single source of truth for ALL submenu items across every
   section. Icon, spacing, colours, hover and active states
   are 100% identical for every item — callers never pass className.

   icon prop:
     • ElementType (e.g. ReceiptText) → rendered at h-3.5 w-3.5
     • undefined                      → renders a small dot indicator
========================================================= */

interface SidebarSubItemProps {
  to: string;
  label: string;
  active: boolean;
  icon?: React.ElementType;
  onNavigate?: () => void;
}

function SidebarSubItem({
  to,
  label,
  active,
  icon: Icon,
  onNavigate,
}: SidebarSubItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={cn(
        // Layout & spacing — identical for every item
        "flex items-center gap-2.5 rounded-lg px-3 py-2",
        // Typography — identical for every item
        "text-xs font-medium",
        // Motion — identical for every item
        "transition-all duration-200 ease-out",
        // Hover — identical for every item
        "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        // State — identical for every item
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border/60 shadow-sm"
          : "text-sidebar-foreground/70"
      )}
    >
      {Icon ? (
        // Route-based items: unique icon at guaranteed fixed size
        <Icon
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0 transition-opacity duration-150",
            active ? "text-primary opacity-100" : "opacity-50"
          )}
        />
      ) : (
        // Tab-based items (fee structures): dot indicator
        <span
          className={cn(
            "flex-shrink-0 h-1 w-1 rounded-full bg-current transition-opacity duration-150",
            active ? "opacity-100" : "opacity-40"
          )}
        />
      )}

      <span className="truncate">{label}</span>
    </NavLink>
  );
}