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

  const isFeeStructuresActive = location.pathname.includes("fee-structures");

  const [expandedSection, setExpandedSection] = useState<string | null>(
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
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") ||
    user?.email?.[0]?.toUpperCase() ||
    "A";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Logo className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">School Admin</div>
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
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground"
              )}
            >
              <Icon
                className={cn("h-4 w-4", active && "text-primary")}
              />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* TEACHERS SECTION */}
        <div className="space-y-1 pt-2">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === "teachers" ? null : "teachers"
              )
            }
            className={cn(
              "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              expandedSection === "teachers"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Users
                className={cn(
                  "h-4 w-4",
                  expandedSection === "teachers" && "text-primary"
                )}
              />
              <span>Teachers</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSection === "teachers" && "rotate-180"
              )}
            />
          </button>

          {expandedSection === "teachers" && (
            <div className="space-y-0.5 pl-6 pt-1">
              {teacherItems.map((item) => {
                const active = location.pathname === item.to;
                const ItemIcon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      "hover:bg-sidebar-accent/50",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70"
                    )}
                  >
                    <ItemIcon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* MASTER DATA SECTION */}
        <div className="space-y-1 pt-2">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === "master-data" ? null : "master-data"
              )
            }
            className={cn(
              "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              expandedSection === "master-data"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Database
                className={cn(
                  "h-4 w-4",
                  expandedSection === "master-data" && "text-primary"
                )}
              />
              <span>Master Data Setup</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSection === "master-data" && "rotate-180"
              )}
            />
          </button>

          {expandedSection === "master-data" && (
            <div className="space-y-0.5 pl-6 pt-1">
              {masterDataItems.map((item) => {
                const active = location.pathname.startsWith(item.to);
                const ItemIcon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      "hover:bg-sidebar-accent/50",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70"
                    )}
                  >
                    <ItemIcon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* STUDENTS SECTION */}
        <div className="space-y-1 pt-2">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === "students" ? null : "students"
              )
            }
            className={cn(
              "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              expandedSection === "students"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <GraduationCap
                className={cn(
                  "h-4 w-4",
                  expandedSection === "students" && "text-primary"
                )}
              />
              <span>Students</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSection === "students" && "rotate-180"
              )}
            />
          </button>

          {expandedSection === "students" && (
            <div className="space-y-0.5 pl-6 pt-1">
              {studentItems.map((item) => {
                const active = location.pathname === item.to;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      "hover:bg-sidebar-accent/50",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70"
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* FEE STRUCTURES SECTION */}
        <div className="space-y-1 pt-2">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === "fee-structures"
                  ? null
                  : "fee-structures"
              )
            }
            className={cn(
              "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              expandedSection === "fee-structures"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <CreditCard
                className={cn(
                  "h-4 w-4",
                  expandedSection === "fee-structures" && "text-primary"
                )}
              />
              <span>Fee Structures</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSection === "fee-structures" && "rotate-180"
              )}
            />
          </button>

          {expandedSection === "fee-structures" && (
            <div className="space-y-0.5 pl-6 pt-1">
              {feeStructureSubItems.map((item) => {
                const active =
                  location.pathname === "/fee-structures" &&
                  location.search.includes(`tab=${item.to.split("tab=")[1]}`);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      "hover:bg-sidebar-accent/50",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70"
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar className="h-9 w-9">
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
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}