import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Wallet,
  ChefHat,
  Settings,
  ChevronLeft,
  Store,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Punto de Venta", href: "/pos", icon: ShoppingCart },
  { name: "Pedidos", href: "/orders", icon: Package },
  { name: "Cocina", href: "/kitchen", icon: ChefHat },
  { name: "Facturación", href: "/checkout", icon: Receipt },
  { name: "Caja", href: "/cashier", icon: Wallet },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen border-r bg-white dark:bg-zinc-950 dark:border-zinc-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b dark:border-zinc-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg">RestaurantERP</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn("ml-auto", collapsed && "mx-auto")}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-3",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
