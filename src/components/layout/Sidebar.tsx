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
  ChevronRight,
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
  IdCard,
  ShieldCheck,
  Award,
  Menu,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout, getCurrentUser } from "@/lib/api/auth";

/* =========================================================
   DESIGN TOKENS  (match screenshot)
========================================================= */

const C = {
  bg:           "hsl(222, 44%, 22%)",  // outer rows — medium navy matching Image 2
  innerBg:      "hsl(222, 50%, 13%)",  // expanded sub-item area — noticeably darker
  headerBg:     "#f5a623",             // orange header bar
  divider:      "hsl(222, 38%, 28%)",  // separator between rows
  iconOrange:   "#f5a623",
  textSection:  "hsl(210, 20%, 72%)",  // section labels — grey-ish, not white
  textWhite:    "#ffffff",
  textMuted:    "hsl(210, 18%, 58%)",  // sub-item inactive
  textActive:   "#f5a623",             // active sub-item = orange
  chevronDim:   "hsl(210, 18%, 48%)",
};

/* =========================================================
   NAV ITEM DEFINITIONS  (unchanged)
========================================================= */

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
];

export const studentItems = [
  { to: "/students",                 label: "Student List",    icon: GraduationCap, exact: true  },
  { to: "/students/admit",           label: "Admit Student",   icon: UserPlus,      exact: false },
  { to: "/id-cards",                 label: "ID Cards",        icon: IdCard,        exact: false },
  { to: "/students/tc-certificates", label: "TC Certificates", icon: ShieldCheck,   exact: false },
];

export const teacherItems = [
  { to: "/teachers/register",            label: "Register Teacher",    icon: UserPlus,      exact: false },
  { to: "/teachers",                     label: "Teacher List",        icon: Users,         exact: true  },
  { to: "/teachers/assignments",         label: "Teacher Assignments", icon: ClipboardList, exact: false },
  { to: "/teachers/subject-assignments", label: "Subject Assignments", icon: BookOpen,      exact: false },
];

export const examManagementItems = [
  { to: "/exam-types",           label: "Create Exam Types",   icon: Award,         exact: true  },
  { to: "/exam-blueprints",      label: "Exam Blueprint",      icon: CalendarDays,  exact: false },
  { to: "/subject-wise-setup",   label: "Subject Wise Setup",  icon: BookOpen,      exact: false },
  { to: "/grade-rule-engine/schemes", label: "Grading Schemes", icon: ShieldCheck,   exact: false },
  { to: "/grade-rule-engine/rules",   label: "Result Rules Mapping", icon: Network,  exact: false },
  { to: "/consolidated-setup",   label: "Consolidated Annual", icon: Network,       exact: false },
  { to: "/independent-results",  label: "Independent Results", icon: ClipboardList, exact: false },
];

export const masterDataItems = [
  { to: "/academic-years",         label: "Academic Year", icon: CalendarDays, exact: false },
  { to: "/class-levels",           label: "Class",         icon: School,       exact: false },
  { to: "/sections",               label: "Sections",      icon: Layers,       exact: false },
  { to: "/class-sections",         label: "Class-Section", icon: Network,      exact: false },
  { to: "/subjects",               label: "Subjects",      icon: BookOpen,     exact: true  },
  { to: "/class-subject-mappings", label: "Class-Subject", icon: Link2,        exact: false },
];

export const feeStructureSubItems = [
  { tabKey: "list",     to: "/fee-structures?tab=list",     label: "List Fee Structures"     },
  { tabKey: "create",   to: "/fee-structures?tab=create",   label: "Create Fee Structure"    },
  { tabKey: "filtered", to: "/fee-structures?tab=filtered", label: "Filtered Fee Structures" },
  { tabKey: "update",   to: "/fee-structures?tab=update",   label: "Update Fee Structure"    },
];

export const reportingItems = [
  { to: "/reports/fees", label: "Fee Report", icon: ReceiptText, exact: false },
];

export const accountingItems = [
  { to: "/accounting/fee-collections", label: "Fee Collections", icon: Wallet, exact: false },
];

/* =========================================================
   ACTIVE MATCHING  (unchanged)
========================================================= */

function isRouteActive(pathname: string, to: string, exact: boolean): boolean {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(to + "/");
}

function isFeeTabActive(pathname: string, search: string, tabKey: string): boolean {
  if (pathname !== "/fee-structures") return false;
  return new URLSearchParams(search).get("tab") === tabKey;
}

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

  const initialSection = (() => {
    const p = location.pathname;
    if (anyActive(studentItems, p))        return "students";
    if (anyActive(teacherItems, p))        return "teachers";
    if (anyActive(masterDataItems, p))     return "master-data";
    if (anyActive(examManagementItems, p)) return "exam-management";
    if (p === "/fee-structures")           return "fee-structures";
    if (anyActive(reportingItems, p))      return "reporting";
    if (anyActive(accountingItems, p))     return "accounting";
    return null;
  })();

  const [expandedSection, setExpandedSection] = useState<string | null>(initialSection);

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
    <div className="flex h-full flex-col" style={{ background: C.bg, color: C.textWhite }}>

      {/* ── Orange header bar ──────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: C.headerBg, minHeight: 64 }}
      >
        {/* Logo + brand */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
            style={{ background: "#ffffff" }}
          >
            <Logo className="h-5 w-5" style={{ color: C.headerBg }} />
          </div>
          <div className="leading-tight">
            <div
              className="text-base font-extrabold tracking-wide uppercase"
              style={{ color: "#ffffff", letterSpacing: "0.12em" }}
            >
              HatSynk
            </div>
            <div
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.80)", letterSpacing: "0.15em" }}
            >
              EduTech
            </div>
          </div>
        </div>

        {/* Hamburger */}
        <button
          aria-label="Toggle menu"
          className="flex items-center justify-center rounded p-1"
          style={{ color: "#ffffff" }}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>

        {/* 1. Dashboard */}
        {navItems.map((item) => {
          const Icon   = item.icon;
          const active = isRouteActive(location.pathname, item.to, false);
          return (
            <div key={item.to} style={{ borderBottom: `1px solid ${C.divider}` }}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className="flex items-center justify-between gap-3 px-5 py-4 text-sm font-medium transition-colors duration-150"
                style={{
                  background: active ? "rgba(245,166,35,0.08)" : "transparent",
                  color: active ? C.iconOrange : C.textSection,
                  fontWeight: active ? 600 : 400,
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 flex-shrink-0" style={{ color: C.iconOrange }} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: C.chevronDim }} />
              </NavLink>
            </div>
          );
        })}

        {/* 2. Students */}
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
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 3. Teachers */}
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
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 3.5. Exam Management */}
        <SidebarSection
          title="Exam Management"
          icon={Award}
          sectionKey="exam-management"
          expanded={expandedSection === "exam-management"}
          onToggle={toggle}
        >
          {examManagementItems.map((item) => (
            <SidebarSubItem
              key={item.to}
              to={item.to}
              label={item.label}
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 4. Master Data Setup */}
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
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 5. Fee Structures */}
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
              active={isFeeTabActive(location.pathname, location.search, item.tabKey)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 6. Reporting */}
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
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {/* 7. Accounting */}
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
              active={isRouteActive(location.pathname, item.to, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

      </nav>

      {/* ── User footer ───────────────────────────────── */}
      <div
        className="p-3"
        style={{ borderTop: `1px solid ${C.divider}`, background: C.innerBg }}
      >
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar
            className="h-10 w-10 flex-shrink-0"
            style={{ border: `1px solid hsl(222, 30%, 26%)` }}
          >
            <AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">
              {initials.toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium" style={{ color: C.textWhite }}>
              {user?.firstName
                ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                : "Administrator"}
            </div>
            <div className="truncate text-xs" style={{ color: C.textMuted }}>
              {user?.email ?? "admin"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Logout"
            className="rounded-lg flex-shrink-0"
            style={{ color: C.textMuted }}
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
   - Icon always orange
   - Title always white (muted when collapsed, white when expanded)
   - ChevronDown when expanded, ChevronRight when collapsed
   - Active sub-items make the section header white + full opacity
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
    <div style={{ borderBottom: `1px solid ${C.divider}` }}>
      {/* Section header row — always lighter navy (C.bg) */}
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-sm transition-colors duration-150"
        style={{
          color:      expanded ? C.textWhite : C.textSection,
          fontWeight: expanded ? 600 : 400,
        }}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 flex-shrink-0" style={{ color: C.iconOrange }} />
          <span>{title}</span>
        </div>

        {/* Down when open, Right when closed */}
        {expanded
          ? <ChevronDown  className="h-4 w-4 flex-shrink-0" style={{ color: C.iconOrange }} />
          : <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: C.chevronDim }} />
        }
      </button>

      {/* Expanded area — darker navy to create depth contrast */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        style={{ background: C.innerBg }}
      >
        <div className="overflow-hidden">
          <div className="pb-2 pt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUB ITEM COMPONENT
   - Active: bold white text, slightly highlighted bg row
   - Inactive: muted text
   - Orange ">" chevron prefix always visible
========================================================= */

interface SidebarSubItemProps {
  to: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}

function SidebarSubItem({ to, label, active, onNavigate }: SidebarSubItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-6 py-2.5 text-sm transition-colors duration-150"
      style={{
        background: active ? "rgba(245,166,35,0.08)" : "transparent",
        color:      active ? C.iconOrange : C.textMuted,
        fontWeight: active ? 700 : 400,
      }}
    >
      <ChevronRight
        className="h-3.5 w-3.5 flex-shrink-0"
        style={{ color: active ? C.iconOrange : "hsl(210, 18%, 42%)" }}
      />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}