import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Package, ScanLine, PlusCircle, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";

const navItems = [
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/add-item", icon: PlusCircle, label: "Add Item" },
  { to: "/scan", icon: ScanLine, label: "Scan" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const { collapsed, setCollapsed } = useSidebarCollapse();

  useEffect(() => {
    if (user) fetchProfile(user.id);
  }, [user]);

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Profile / Branding */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={profile?.profile_image || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {profile?.username?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-sidebar-primary break-words">
                {profile?.school_name || "School Name"}
              </h1>
              <p className="text-[10px] text-sidebar-foreground/60 font-mono break-words">
                {profile?.username || user?.email}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => signOut()}
          title="Sign Out"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-destructive w-full transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
