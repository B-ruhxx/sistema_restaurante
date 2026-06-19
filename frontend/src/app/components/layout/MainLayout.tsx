import { useState } from "react";
import { Outlet, Navigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuthContext as useAuth } from "../../contexts/AuthContext";
import { cn } from "../ui/utils";

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
