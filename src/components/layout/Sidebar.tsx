import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, GraduationCap, Users, BookOpen, LogOut, GraduationCap as Logo, Link2, CreditCard, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logout, getCurrentUser } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/teachers", label: "Teachers", icon: Users },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
];


export const classSubjectSubItems = [
  { to: "/class-subject-mappings?tab=create", label: "Create Mapping", icon: "plus" },
  { to: "/class-subject-mappings?tab=list", label: "List All Mappings", icon: "list" },
  { to: "/class-subject-mappings?tab=get", label: "Get by ID", icon: "search" },
  { to: "/class-subject-mappings?tab=delete", label: "Delete Mapping", icon: "trash" },
];

export const feeStructureSubItems = [
  { to: "/fee-structures?tab=create", label: "Create Fee Structure", icon: "plus" },
  { to: "/fee-structures?tab=list", label: "List Fee Structures", icon: "list" },
  { to: "/fee-structures?tab=update", label: "Update Fee Structure", icon: "edit" },
  { to: "/fee-structures?tab=filtered", label: "Filtered Fee Structures", icon: "filter" },
];

export function getActiveNav(pathname: string) {
  return navItems.find((n) => pathname === n.to || pathname.startsWith(n.to + "/")) ?? navItems[0];
}

interface SidebarContentProps {
  onNavigate?: () => void;
}

export default function SidebarContent({ onNavigate }: SidebarContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  let user = null;

  try {
    user = getCurrentUser();
  } catch (e) {
    console.error("Sidebar getCurrentUser failed:", e);
    user = null;
  }
  const [expandedSection, setExpandedSection] = useState<string | null>(
    location.pathname.includes("students")
      ? "students"
      : location.pathname.includes("class-subject")
      ? "class-subject"
      : location.pathname.includes("fee-structures")
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

  const isClassSubjectActive = location.pathname.includes("class-subject");
  const isFeeStructuresActive = location.pathname.includes("fee-structures");

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Logo className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">School Admin</div>
          <div className="text-xs text-muted-foreground">Management Panel</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            location.pathname === item.to || location.pathname.startsWith(item.to + "/");
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
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Students Collapsible Section */}
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
              <GraduationCap className={cn("h-4 w-4", expandedSection === "students" && "text-primary")} />
              <span>Students</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSection === "students" && "rotate-180"
              )}
            />
          </button>

          {/* Sub-items */}
          {expandedSection === "students" && (
            <div className="space-y-0.5 pl-6">
              <NavLink
                to="/students"
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  "hover:bg-sidebar-accent/50",
                  location.pathname === "/students" && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <span className="w-1 h-1 rounded-full" />
                <span>Student List</span>
              </NavLink>

              <NavLink
                to="/students/admit"
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  "hover:bg-sidebar-accent/50",
                  location.pathname === "/students/admit" && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <span className="w-1 h-1 rounded-full" />
                <span>Admit Student</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Class-Subject Collapsible Section */}
        <div className="space-y-1 pt-2">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === "class-subject" ? null : "class-subject"
              )
            }

            className={cn(
              "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isClassSubjectActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Link2 className={cn("h-4 w-4", isClassSubjectActive && "text-primary")} />
              <span>Class-Subjects</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSection === "class-subject" && "rotate-180"
              )}
            />
          </button>

          {/* Sub-items */}
          {expandedSection === "class-subject" && (
            <div className="space-y-0.5 pl-6">
              {classSubjectSubItems.map((item) => {
                const active = location.pathname === "/class-subject-mappings" && 
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
                    <span className="w-1 h-1 rounded-full" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* Fee Structures Collapsible Section */}
        <div className="space-y-1 pt-2">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === "fee-structures" ? null : "fee-structures"
              )
            }
            className={cn(
              "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isFeeStructuresActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <CreditCard className={cn("h-4 w-4", isFeeStructuresActive && "text-primary")} />
              <span>Fee Structures</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSection === "fee-structures" && "rotate-180"
              )}
            />
          </button>

          {/* Sub-items */}
          {expandedSection === "fee-structures" && (
            <div className="space-y-0.5 pl-6">
              {feeStructureSubItems.map((item) => {
                const active = location.pathname === "/fee-structures" && 
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
                    <span className="w-1 h-1 rounded-full" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">
              {initials.toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "Administrator"}
            </div>
            <div className="truncate text-xs text-muted-foreground">{user?.email ?? "admin"}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
