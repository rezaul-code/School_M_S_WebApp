import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, GraduationCap, Users, BookOpen, Wallet, LogOut, GraduationCap as Logo, Link2, CreditCard } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logout, getCurrentUser } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/students", label: "Students", icon: GraduationCap },
  { to: "/teachers", label: "Teachers", icon: Users },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/fee", label: "Fee", icon: Wallet },
  { to: "/class-subject-mappings", label: "Class-Subjects", icon: Link2 },
  { to: "/fee-structures", label: "Fee Structures", icon: CreditCard },
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
  const user = getCurrentUser();

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
