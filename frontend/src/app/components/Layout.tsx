import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import { useConfigStore } from '../../store/configStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore, AppNotificationType } from '../../store/notificationStore';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSIONS, type PermissionCode } from '../../config/permissions';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  Wallet,
  X,
  Sun,
  Moon,
  LogOut,
  Settings,
  Bell,
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
  CheckCircle2,
  AlertTriangle,
  Info,
  Armchair,
  Menu,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn, getFullImageUrl } from './ui/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useERP } from '../contexts/ERPContextValue';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  permiso?: PermissionCode | PermissionCode[];
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
      { path: '/mesas', icon: Armchair, label: 'Mesas', permiso: PERMISSIONS.GESTION_MESAS },
      { path: '/pos', icon: ShoppingCart, label: 'Punto de Venta', permiso: PERMISSIONS.GESTION_POS },
      { path: '/pedidos', icon: ClipboardList, label: 'Pedidos', permiso: PERMISSIONS.GESTION_POS },
      { path: '/cocina', icon: ChefHat, label: 'Cocina', permiso: PERMISSIONS.GESTION_COCINA },
      { path: '/caja', icon: Wallet, label: 'Caja', permiso: PERMISSIONS.GESTION_CAJA },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { path: '/categorias', icon: Tag, label: 'Categorías', permiso: PERMISSIONS.ACCESO_TOTAL },
      { path: '/productos', icon: Package, label: 'Productos', permiso: PERMISSIONS.ACCESO_TOTAL },
      { path: '/combos', icon: Gift, label: 'Combos y Promos', permiso: PERMISSIONS.ACCESO_TOTAL },
      { path: '/extras', icon: PlusCircle, label: 'Extras', permiso: PERMISSIONS.ACCESO_TOTAL },
    ],
  },
  {
    label: 'Producción',
    items: [
      { path: '/recetas', icon: FlaskConical, label: 'Recetas', permiso: PERMISSIONS.ACCESO_TOTAL },
      { path: '/insumos', icon: Boxes, label: 'Insumos', permiso: PERMISSIONS.ACCESO_TOTAL },
      { path: '/kardex', icon: BookOpen, label: 'Kardex', permiso: [PERMISSIONS.ACCESO_TOTAL, PERMISSIONS.GESTION_REPORTES] },
      { path: '/inventario', icon: PackageSearch, label: 'Inv. Directos', permiso: PERMISSIONS.ACCESO_TOTAL },
    ],
  },
  {
    label: 'Compras',
    items: [
      { path: '/proveedores', icon: Truck, label: 'Proveedores', permiso: PERMISSIONS.GESTION_COMPRAS },
      { path: '/compras', icon: ShoppingBag, label: 'Compras', permiso: PERMISSIONS.GESTION_COMPRAS },
    ],
  },
  {
    label: 'Administración',
    items: [
      { path: '/dashboard-gerencial', icon: TrendingUp, label: 'Dashboard Gerencial', permiso: PERMISSIONS.GESTION_REPORTES },
      { path: '/reportes', icon: FileText, label: 'Reportes', permiso: PERMISSIONS.GESTION_REPORTES },
      { path: '/clientes', icon: Users, label: 'Clientes', permiso: [PERMISSIONS.ACCESO_TOTAL, PERMISSIONS.GESTION_VENTAS] },
      { path: '/ventas', icon: FileText, label: 'Ventas', permiso: [PERMISSIONS.GESTION_VENTAS, PERMISSIONS.GESTION_CAJA] },
      { path: '/empleados', icon: UserCog, label: 'Empleados', permiso: PERMISSIONS.GESTION_EMPLEADOS },
      { path: '/roles', icon: Shield, label: 'Roles y Permisos', permiso: PERMISSIONS.ACCESO_TOTAL },
      { path: '/metodos-pago', icon: CreditCard, label: 'Métodos de Pago', permiso: [PERMISSIONS.ACCESO_TOTAL, PERMISSIONS.GESTION_CAJA] },
      { path: '/configuracion', icon: Building2, label: 'Configuración', permiso: PERMISSIONS.GESTION_CONFIGURACION },
      { path: '/auditoria', icon: History, label: 'Auditoría', permiso: PERMISSIONS.GESTION_REPORTES },
      { path: '/seguridad', icon: Lock, label: 'Seguridad', permiso: PERMISSIONS.ACCESO_TOTAL },
    ],
  },
];

const canAccessItem = (userPermisos: string[], permiso?: PermissionCode | PermissionCode[]) => {
  if (!permiso) return true;
  if (userPermisos.includes(PERMISSIONS.ACCESO_TOTAL)) return true;
  const required = Array.isArray(permiso) ? permiso : [permiso];
  return required.some((p) => userPermisos.includes(p));
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Operaciones: true, Catálogo: true, Producción: true, Compras: true, Administración: true,
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { orders, cashRegister } = useERP();
  const { name, logoUrl } = useConfigStore();
  const { user, isAuthenticated } = useAuthStore();
  const {
    notifications,
    markAllAsRead,
    removeNotification,
    clearNotifications,
  } = useNotificationStore();
  const { logout } = useAuth();
  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setCollapsed(mobile ? true : false);
      if (!mobile) setMobileMenuOpen(false);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const activeOrders = orders.filter(o =>
    o.status === 'pendiente' || o.status === 'en-cocina'
  ).length;
  const unreadNotifications = notifications.filter(notification => !notification.read).length;

  const notificationIcon = (type: AppNotificationType) => {
    const className = 'w-3.5 h-3.5';
    if (type === 'success') return <CheckCircle2 className={`${className} ui-status-success`} />;
    if (type === 'error') return <X className={`${className} ui-status-danger`} />;
    if (type === 'warning') return <AlertTriangle className={`${className} ui-status-warning`} />;
    return <Info className={`${className} ui-status-info`} />;
  };

  const formatNotificationTime = (createdAt: string) => {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(createdAt));
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="theme-new flex h-screen bg-background text-foreground">
      {isMobile && mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col shrink-0 z-50',
          isMobile
            ? cn(
              'fixed left-0 top-0 h-full w-72 shadow-ui-high',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            )
            : (collapsed ? 'w-16' : 'w-60')
        )}
      >
        {/* Logo */}
        <div className="h-14 border-b border-sidebar-border flex items-center px-4 flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 w-full">
              {logoUrl ? (
                <img src={getFullImageUrl(logoUrl)} alt="logo" className="w-8 h-8 rounded-lg object-cover shadow-ui-low border border-sidebar-border" />
              ) : (
                <div className="w-8 h-8 bg-sidebar-accent rounded-lg flex items-center justify-center flex-shrink-0 shadow-ui-low border border-sidebar-border">
                  <ChefHat className="w-4 h-4 text-sidebar-accent-foreground" />
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
                className="w-8 h-8 bg-sidebar-accent rounded-lg flex items-center justify-center shadow-ui-low border border-sidebar-border"
                onClick={() => setCollapsed(false)}
              >
                <ChefHat className="w-4 h-4 text-sidebar-accent-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
          {navGroups.map((group, gi) => {
            const userPermisos = user?.permisos || [];
            const visibleItems = group.items.filter(item => canAccessItem(userPermisos, item.permiso));

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 mb-1 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.12em] hover:text-muted-foreground transition-colors"
                  >
                    <span>{group.label}</span>
                    {expandedGroups[group.label]
                      ? <ChevronDown className="w-3 h-3" />
                      : <ChevronRight className="w-3 h-3" />
                    }
                  </button>
                )}
                {collapsed && gi > 0 && (
                  <div className="mx-auto my-3 w-5 h-px bg-border" />
                )}
                {(collapsed || expandedGroups[group.label]) && (
                  <div className="space-y-0.5">
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
                            'relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-sm group',
                            isActive
                              ? 'bg-sidebar-primary/10 text-sidebar-primary font-semibold'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium'
                          )}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-sidebar-primary" />
                          )}
                          <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100')} />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {badge > 0 && (
                                <span className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                  {badge}
                                </span>
                              )}
                            </>
                          )}
                          {collapsed && badge > 0 && (
                            <span className="absolute right-1 top-1 w-1.5 h-1.5 bg-destructive rounded-full" />
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
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground -ml-1"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
            <div>
              <p className="font-semibold text-sm tracking-tight">
                {navGroups
                  .flatMap(g => g.items)
                  .find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </p>
              {cashRegister?.status === 'abierta' && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full ui-status-success-bg" />
                  Caja abierta · S/ {cashRegister.currentBalance.toFixed(2)}
                </p>
              )}
            </div>
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

            <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground hover:text-foreground">
                  <Bell className="w-4 h-4" />
                  {(unreadNotifications > 0 || activeOrders > 0) && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-1 ui-status-danger-bg text-[10px] font-bold rounded-full border-2 border-card flex items-center justify-center">
                      {unreadNotifications || activeOrders}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <div>
                    <p className="font-semibold text-sm">Notificaciones</p>
                    <p className="text-xs text-muted-foreground">
                      {notifications.length > 0 ? `${notifications.length} eventos recientes` : 'Sin eventos recientes'}
                    </p>
                  </div>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={clearNotifications}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No hay notificaciones todavía.
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`group flex gap-2 px-3 py-2 border-b last:border-b-0 ${notification.read ? 'bg-card' : 'bg-accent/40'}`}
                      >
                        <div className="mt-0.5 shrink-0">{notificationIcon(notification.type)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug break-words">{notification.title}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </div>
                          {notification.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 break-words">{notification.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                          onClick={() => removeNotification(notification.id)}
                          title="Quitar notificación"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-5 bg-border mx-2" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-lg hover:bg-accent transition-colors group">
                  {user?.fotoUrl ? (
                    <img src={user.fotoUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold ring-2 ring-primary/20">
                      {user?.nombre?.charAt(0) ?? 'U'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold leading-none text-foreground">{user?.nombre || 'Usuario'}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{(user?.rol || 'admin').toLowerCase()}</p>
                  </div>
                  <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
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
                <DropdownMenuItem onClick={() => navigate('/perfil')}>
                  <Settings className="w-4 h-4 mr-2" />Mi perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="ui-status-danger focus:text-[var(--status-danger)]">
                  <LogOut className="w-4 h-4 mr-2" />Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn('flex-1 overflow-auto bg-background', isMobile && 'pb-4')}>
          {children}
        </main>
      </div>
    </div>
  );
}
