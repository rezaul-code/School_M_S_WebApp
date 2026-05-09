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
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { logout, getCurrentUser } from "@/lib/api/auth";

/* =========================================================
   MAIN NAV
========================================================= */

export const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: Home,
  },
];

/* =========================================================
   TEACHERS SUBMENU
========================================================= */

export const teacherItems = [
  {
    to: "/teachers/register",
    label: "Register Teacher",
    icon: UserPlus,
  },
  {
    to: "/teachers",
    label: "Teacher List",
    icon: Users,
  },
  {
    to: "/teachers/assignments",
    label: "Teacher Assignments",
    icon: ClipboardList,
  },
  {
    to: "/teachers/subject-assignments",
    label: "Subject Assignments",
    icon: BookOpen,
  },
];

/* =========================================================
   MASTER DATA
========================================================= */

export const masterDataItems = [
  {
    to: "/academic-years",
    label: "Academic Year",
    icon: CalendarDays,
  },
  {
    to: "/class-levels",
    label: "Class",
    icon: School,
  },
  {
    to: "/sections",
    label: "Sections",
    icon: Layers,
  },
  {
    to: "/class-sections",
    label: "Class-Section",
    icon: Network,
  },
  {
    to: "/subjects",
    label: "Subjects",
    icon: BookOpen,
  },
  {
    to: "/class-subject-mappings",
    label: "Class-Subject",
    icon: Link2,
  },
];

/* =========================================================
   FEE STRUCTURES
========================================================= */

export const feeStructureSubItems = [
  {
    to: "/fee-structures?tab=create",
    label: "Create Fee Structure",
  },
  {
    to: "/fee-structures?tab=list",
    label: "List Fee Structures",
  },
  {
    to: "/fee-structures?tab=update",
    label: "Update Fee Structure",
  },
  {
    to: "/fee-structures?tab=filtered",
    label: "Filtered Fee Structures",
  },
];

/* =========================================================
   STUDENTS SUBMENU
========================================================= */

export const studentItems = [
  {
    to: "/students",
    label: "Student List",
  },
  {
    to: "/students/admit",
    label: "Admit Student",
  },
];

/* =========================================================
   SIDEBAR COMPONENT
========================================================= */

export default function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const location = useLocation();

  const navigate = useNavigate();

  let user = null;

  try {
    user = getCurrentUser();
  } catch {
    user = null;
  }

  const isTeachersActive = teacherItems.some((item) =>
    location.pathname.startsWith(item.to)
  );

  const isMasterDataActive = masterDataItems.some((item) =>
    location.pathname.startsWith(item.to)
  );

  const isStudentsActive = studentItems.some((item) =>
    location.pathname.startsWith(item.to)
  );

  const isFeeStructuresActive =
    location.pathname.includes("fee-structures");

  const [expandedSection, setExpandedSection] =
    useState<string | null>(
      isTeachersActive
        ? "teachers"
        : isStudentsActive
          ? "students"
          : isMasterDataActive
            ? "master-data"
            : isFeeStructuresActive
              ? "fee-structures"
              : null
    );

  const initials =
    (user?.firstName?.[0] ?? "") +
      (user?.lastName?.[0] ?? "") ||
    user?.email?.[0]?.toUpperCase() ||
    "A";

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border/70 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Logo className="h-5 w-5" />
        </div>

        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide">
            School Admin
          </div>

          <div className="text-xs text-muted-foreground">
            Management Panel
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Dashboard */}
        {navItems.map((item) => {
          const active =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + "/");

          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border/60 shadow-sm"
                  : "text-sidebar-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active && "text-primary"
                )}
              />

              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* TEACHERS */}
        <SidebarSection
          title="Teachers"
          icon={Users}
          expanded={expandedSection === "teachers"}
          onClick={() =>
            setExpandedSection(
              expandedSection === "teachers"
                ? null
                : "teachers"
            )
          }
        >
          {teacherItems.map((item) => {
            const active = location.pathname === item.to;

            const ItemIcon = item.icon;

            return (
              <SidebarSubItem
                key={item.to}
                to={item.to}
                active={active}
                onNavigate={onNavigate}
                icon={<ItemIcon className="h-3.5 w-3.5" />}
                label={item.label}
              />
            );
          })}
        </SidebarSection>

        {/* MASTER DATA */}
        <SidebarSection
          title="Master Data Setup"
          icon={Database}
          expanded={expandedSection === "master-data"}
          onClick={() =>
            setExpandedSection(
              expandedSection === "master-data"
                ? null
                : "master-data"
            )
          }
        >
          {masterDataItems.map((item) => {
            const active =
              location.pathname.startsWith(item.to);

            const ItemIcon = item.icon;

            return (
              <SidebarSubItem
                key={item.to}
                to={item.to}
                active={active}
                onNavigate={onNavigate}
                icon={<ItemIcon className="h-3.5 w-3.5" />}
                label={item.label}
              />
            );
          })}
        </SidebarSection>

        {/* STUDENTS */}
        <SidebarSection
          title="Students"
          icon={GraduationCap}
          expanded={expandedSection === "students"}
          onClick={() =>
            setExpandedSection(
              expandedSection === "students"
                ? null
                : "students"
            )
          }
        >
          {studentItems.map((item) => {
            const active = location.pathname === item.to;

            return (
              <SidebarSubItem
                key={item.to}
                to={item.to}
                active={active}
                onNavigate={onNavigate}
                label={item.label}
              />
            );
          })}
        </SidebarSection>

        {/* FEE STRUCTURES */}
        <SidebarSection
          title="Fee Structures"
          icon={CreditCard}
          expanded={expandedSection === "fee-structures"}
          onClick={() =>
            setExpandedSection(
              expandedSection === "fee-structures"
                ? null
                : "fee-structures"
            )
          }
        >
          {feeStructureSubItems.map((item) => {
            const active =
              location.pathname === "/fee-structures" &&
              location.search.includes(
                `tab=${item.to.split("tab=")[1]}`
              );

            return (
              <SidebarSubItem
                key={item.to}
                to={item.to}
                active={active}
                onNavigate={onNavigate}
                label={item.label}
              />
            );
          })}
        </SidebarSection>
      </nav>

      {/* Footer */}
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
                ? `${user.firstName} ${
                    user.lastName ?? ""
                  }`.trim()
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
========================================================= */

function SidebarSection({
  title,
  icon: Icon,
  expanded,
  onClick,
  children,
}: any) {
  return (
    <div className="space-y-1 pt-2">
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          expanded
            ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border/60 shadow-sm"
            : "text-sidebar-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              "h-4 w-4",
              expanded && "text-primary"
            )}
          />

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
        <div className="space-y-1 pl-6 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUB ITEM COMPONENT
========================================================= */

function SidebarSubItem({
  to,
  active,
  label,
  icon,
  onNavigate,
}: any) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ease-out",
        "hover:bg-sidebar-accent/50",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border/60"
          : "text-sidebar-foreground/70"
      )}
    >
      {icon || (
        <span className="w-1 h-1 rounded-full bg-current opacity-50" />
      )}

      <span>{label}</span>
    </NavLink>
  );
}