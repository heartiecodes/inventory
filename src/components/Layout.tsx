import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";

export default function Layout() {
  const { collapsed } = useSidebarCollapse();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppSidebar />
      <div className={`${collapsed ? "ml-16" : "ml-64"} flex-1 flex flex-col transition-all duration-300`}>
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
        <footer className="border-t px-8 py-4 text-center text-sm text-muted-foreground">
          © All rights reserved. 2026. Golden Key Integrated School of St. Joseph
        </footer>
      </div>
    </div>
  );
}
