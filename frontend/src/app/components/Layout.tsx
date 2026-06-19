import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import { useConfigStore } from '../../store/configStore';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  Wallet,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Settings,
  Bell,
  User,
  Tag,
  Package,
  FlaskConical,
  Boxes,
  BookOpen,
  PackageSearch,
  Truck,
  ShoppingBag,
  Gift,
  ChevronDown,
  ChevronRight,
  Users,
  UserCog,
  Shield,
  CreditCard,
  PlusCircle,
  FileText,
  History,
  Building2,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useERP } from '../contexts/ERPContext';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  permiso?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Operaciones',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/pos', icon: ShoppingCart, label: 'Punto de Venta', permiso: 'GESTIONAR_VENTAS' },
      { path: '/pedidos', icon: ClipboardList, label: 'Pedidos', permiso: 'GESTIONAR_PEDIDOS' },
      { path: '/cocina', icon: ChefHat, label: 'Cocina', permiso: 'VER_COCINA' },
      { path: '/caja', icon: Wallet, label: 'Caja', permiso: 'CONTROL_CAJA' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { path: '/categorias', icon: Tag, label: 'Categorías', permiso: 'GESTIONAR_INVENTARIO' },
      { path: '/productos', icon: Package, label: 'Productos', permiso: 'GESTIONAR_INVENTARIO' },
      { path: '/combos', icon: Gift, label: 'Combos y Promos', permiso: 'GESTIONAR_INVENTARIO' },
      { path: '/extras', icon: PlusCircle, label: 'Extras', permiso: 'GESTIONAR_INVENTARIO' },
    ],
  },
  {
    label: 'Producción',
    items: [
      { path: '/recetas', icon: FlaskConical, label: 'Recetas', permiso: 'GESTIONAR_INVENTARIO' },
      { path: '/insumos', icon: Boxes, label: 'Insumos', permiso: 'GESTIONAR_INVENTARIO' },
      { path: '/kardex', icon: BookOpen, label: 'Kardex', permiso: 'GESTIONAR_INVENTARIO' },
      { path: '/inventario', icon: PackageSearch, label: 'Inv. Directos', permiso: 'GESTIONAR_INVENTARIO' },
    ],
  },
  {
    label: 'Compras',
    items: [
      { path: '/proveedores', icon: Truck, label: 'Proveedores', permiso: 'GESTIONAR_INVENTARIO' },
      { path: '/compras', icon: ShoppingBag, label: 'Compras', permiso: 'GESTIONAR_INVENTARIO' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { path: '/dashboard-gerencial', icon: TrendingUp, label: 'Dashboard Gerencial', permiso: 'VER_DASHBOARD' },
      { path: '/reportes', icon: FileText, label: 'Reportes', permiso: 'VER_DASHBOARD' },
      { path: '/clientes', icon: Users, label: 'Clientes', permiso: 'ACCESO_TOTAL' },
      { path: '/empleados', icon: UserCog, label: 'Empleados', permiso: 'ACCESO_TOTAL' },
      { path: '/roles', icon: Shield, label: 'Roles y Permisos', permiso: 'ACCESO_TOTAL' },
      { path: '/metodos-pago', icon: CreditCard, label: 'Métodos de Pago', permiso: 'ACCESO_TOTAL' },
      { path: '/configuracion', icon: Building2, label: 'Configuración', permiso: 'ACCESO_TOTAL' },
      { path: '/auditoria', icon: History, label: 'Auditoría', permiso: 'ACCESO_TOTAL' },
      { path: '/seguridad', icon: Lock, label: 'Seguridad', permiso: 'ACCESO_TOTAL' },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Operaciones: true, Catálogo: true, Producción: true, Compras: true, Administración: true,
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { orders, cashRegister } = useERP();
  const { name, logoUrl } = useConfigStore();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const activeOrders = orders.filter(o =>
    o.status === 'pendiente' || o.status === 'en-cocina'
  ).length;

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col shrink-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="h-14 border-b border-sidebar-border flex items-center px-4 flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 w-full">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="w-8 h-8 rounded-xl object-cover shadow-sm border border-[#c5d8fc] dark:border-blue-900" />
              ) : (
                <div className="w-8 h-8 bg-[#e8f0fe] dark:bg-blue-950 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-[#c5d8fc] dark:border-blue-900">
                  <ChefHat className="w-4 h-4 text-[#4f7bf7] dark:text-blue-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm tracking-tight leading-none text-foreground">{name || 'RestaurantERP'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Sistema de Gestión</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setCollapsed(true)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                className="w-8 h-8 bg-[#e8f0fe] dark:bg-blue-950 rounded-xl flex items-center justify-center shadow-sm border border-[#c5d8fc] dark:border-blue-900"
                onClick={() => setCollapsed(false)}
              >
                <ChefHat className="w-4 h-4 text-[#4f7bf7] dark:text-blue-400" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
          {navGroups.map(group => {
            const userPermisos = user?.permisos || [];
            const visibleItems = group.items.filter(item => {
              return !item.permiso || 
                     userPermisos.includes('ACCESO_TOTAL') || 
                     userPermisos.includes(item.permiso);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="mb-1">
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors mt-3 first:mt-1"
                  >
                    <span>{group.label}</span>
                    {expandedGroups[group.label]
                      ? <ChevronDown className="w-2.5 h-2.5" />
                      : <ChevronRight className="w-2.5 h-2.5" />
                    }
                  </button>
                )}
                {(collapsed || expandedGroups[group.label]) && (
                  <div className="space-y-0.5 mt-0.5">
                    {visibleItems.map(item => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      const badge = item.path === '/pedidos' ? activeOrders : 0;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-sm',
                            isActive
                              ? 'bg-red-600 text-white shadow-sm font-semibold'
                              : 'text-muted-foreground hover:bg-red-600 hover:text-white font-medium'
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0 opacity-90" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {badge > 0 && (
                                <span className="ml-auto bg-white/20 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                  {badge}
                                </span>
                              )}
                            </>
                          )}
                          {collapsed && badge > 0 && (
                            <span className="absolute right-1 top-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card px-5 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="font-semibold text-sm tracking-tight">
              {navGroups
                .flatMap(g => g.items)
                .find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </p>
            {cashRegister?.status === 'abierta' && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                Caja abierta · S/ {cashRegister.currentBalance.toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              {activeOrders > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
              )}
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors">
                  {user?.fotoUrl ? (
                    <img src={user.fotoUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                      {user?.nombre?.charAt(0) ?? 'U'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold leading-none">{user?.nombre || 'Usuario'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{user?.email || ''}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-semibold text-sm">{user?.nombre || 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
