import type { LucideIcon } from 'lucide-react';
import {
  Armchair,
  BookOpen,
  Boxes,
  Building2,
  ChefHat,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  Gift,
  LayoutDashboard,
  Lock,
  Package,
  PackageSearch,
  PlusCircle,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
  History,
} from 'lucide-react';
import { PERMISSIONS, type PermissionCode } from './permissions';

export type RoutePermission = PermissionCode | readonly PermissionCode[];

export interface ProtectedNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  permiso?: RoutePermission;
}

export interface ProtectedNavGroup {
  label: string;
  items: readonly ProtectedNavItem[];
}

export const PROTECTED_NAV_GROUPS: readonly ProtectedNavGroup[] = [
  {
    label: 'Operaciones',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/mesas', icon: Armchair, label: 'Mesas', permiso: PERMISSIONS.GESTION_MESAS },
      { path: '/pos', icon: ShoppingCart, label: 'Punto de Venta', permiso: PERMISSIONS.GESTION_POS },
      {
        path: '/pedidos',
        icon: ClipboardList,
        label: 'Pedidos',
        permiso: [PERMISSIONS.GESTION_POS, PERMISSIONS.GESTION_CAJA],
      },
      { path: '/cocina', icon: ChefHat, label: 'Cocina', permiso: PERMISSIONS.GESTION_COCINA },
      { path: '/caja', icon: Wallet, label: 'Caja', permiso: PERMISSIONS.GESTION_CAJA },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { path: '/categorias', icon: Tag, label: 'Categorías', permiso: PERMISSIONS.GESTION_PRODUCTOS },
      { path: '/productos', icon: Package, label: 'Productos', permiso: PERMISSIONS.GESTION_PRODUCTOS },
      { path: '/combos', icon: Gift, label: 'Combos y Promos', permiso: PERMISSIONS.GESTION_PRODUCTOS },
      { path: '/extras', icon: PlusCircle, label: 'Extras', permiso: PERMISSIONS.GESTION_PRODUCTOS },
    ],
  },
  {
    label: 'Producción',
    items: [
      { path: '/recetas', icon: FlaskConical, label: 'Recetas', permiso: PERMISSIONS.GESTION_RECETAS },
      { path: '/insumos', icon: Boxes, label: 'Insumos', permiso: PERMISSIONS.GESTION_INVENTARIO },
      { path: '/kardex', icon: BookOpen, label: 'Kardex', permiso: PERMISSIONS.GESTION_INVENTARIO },
      { path: '/inventario', icon: PackageSearch, label: 'Inv. Directos', permiso: PERMISSIONS.GESTION_INVENTARIO },
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
      { path: '/roles', icon: Shield, label: 'Roles y Permisos', permiso: PERMISSIONS.GESTION_ROLES },
      { path: '/metodos-pago', icon: CreditCard, label: 'Métodos de Pago', permiso: [PERMISSIONS.ACCESO_TOTAL, PERMISSIONS.GESTION_CAJA] },
      { path: '/configuracion', icon: Building2, label: 'Configuración', permiso: PERMISSIONS.GESTION_CONFIGURACION },
      { path: '/auditoria', icon: History, label: 'Auditoría', permiso: PERMISSIONS.GESTION_AUDITORIA },
      { path: '/seguridad', icon: Lock, label: 'Seguridad', permiso: PERMISSIONS.ACCESO_TOTAL },
    ],
  },
] as const;

const PROTECTED_NAV_ITEMS = PROTECTED_NAV_GROUPS.flatMap((group) => group.items);

export const PROTECTED_ROUTE_PERMISSIONS: Record<string, RoutePermission | undefined> =
  PROTECTED_NAV_ITEMS.reduce<Record<string, RoutePermission | undefined>>((permissions, item) => {
    permissions[item.path] = item.permiso;
    return permissions;
  }, {});

export const FRONTEND_PERMISSION_NOTES: Partial<Record<PermissionCode, string>> = {
  [PERMISSIONS.GESTION_PEDIDOS]: 'Permiso sembrado en backend, pero sin ruta enlazable en Fase 2 porque PedidoController no lo autoriza; /pedidos sigue el contrato real con GESTION_POS o GESTION_CAJA.',
};

export const hasRequiredPermission = (
  userPermisos: readonly string[],
  permiso?: RoutePermission
) => {
  if (!permiso) return true;
  if (userPermisos.includes(PERMISSIONS.ACCESO_TOTAL)) return true;
  const required = Array.isArray(permiso) ? permiso : [permiso];
  return required.some((code) => userPermisos.includes(code));
};

export const getProtectedRoutePermission = (path: string) => PROTECTED_ROUTE_PERMISSIONS[path];

export const getProtectedRouteLabel = (path: string) =>
  PROTECTED_NAV_ITEMS.find((item) => item.path === path)?.label;
