import type React from 'react';
import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  getProtectedRoutePermission,
  type RoutePermission,
} from '../config/protectedNavigation';
import { ERPProvider } from './contexts/ERPContext';
import {
  Audit,
  CashRegister,
  Categories,
  Combos,
  CompanySettings,
  Customers,
  Dashboard,
  DirectInventory,
  Employees,
  ExecutiveDashboard,
  Kardex,
  Kitchen,
  Orders,
  PaymentMethods,
  POS,
  ProductExtras,
  Products,
  Profile,
  Purchases,
  RecipeBuilder,
  Reports,
  Roles,
  Sales,
  Security,
  Suppliers,
  Supplies,
  Tables,
} from './lazyPages';

const routeFallback = (
  <div className="p-6 text-sm text-muted-foreground">Cargando módulo...</div>
);

const protectedPage = (page: React.ReactNode, permiso?: RoutePermission) => (
  <ProtectedRoute permiso={permiso}>
    <ERPProvider>
      <Layout>
        <Suspense fallback={routeFallback}>{page}</Suspense>
      </Layout>
    </ERPProvider>
  </ProtectedRoute>
);

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/', element: protectedPage(<Dashboard />) },
  { path: '/mesas', element: protectedPage(<Tables />, getProtectedRoutePermission('/mesas')) },
  { path: '/pos', element: protectedPage(<POS />, getProtectedRoutePermission('/pos')) },
  { path: '/pedidos', element: protectedPage(<Orders />, getProtectedRoutePermission('/pedidos')) },
  { path: '/cocina', element: protectedPage(<Kitchen />, getProtectedRoutePermission('/cocina')) },
  { path: '/caja', element: protectedPage(<CashRegister />, getProtectedRoutePermission('/caja')) },
  // Fase 2
  { path: '/categorias', element: protectedPage(<Categories />, getProtectedRoutePermission('/categorias')) },
  { path: '/productos', element: protectedPage(<Products />, getProtectedRoutePermission('/productos')) },
  { path: '/combos', element: protectedPage(<Combos />, getProtectedRoutePermission('/combos')) },
  { path: '/extras', element: protectedPage(<ProductExtras />, getProtectedRoutePermission('/extras')) },
  { path: '/recetas', element: protectedPage(<RecipeBuilder />, getProtectedRoutePermission('/recetas')) },
  { path: '/insumos', element: protectedPage(<Supplies />, getProtectedRoutePermission('/insumos')) },
  { path: '/kardex', element: protectedPage(<Kardex />, getProtectedRoutePermission('/kardex')) },
  { path: '/inventario', element: protectedPage(<DirectInventory />, getProtectedRoutePermission('/inventario')) },
  { path: '/proveedores', element: protectedPage(<Suppliers />, getProtectedRoutePermission('/proveedores')) },
  { path: '/compras', element: protectedPage(<Purchases />, getProtectedRoutePermission('/compras')) },
  // Fase 3 - Administración
  { path: '/dashboard-gerencial', element: protectedPage(<ExecutiveDashboard />, getProtectedRoutePermission('/dashboard-gerencial')) },
  { path: '/reportes', element: protectedPage(<Reports />, getProtectedRoutePermission('/reportes')) },
  { path: '/clientes', element: protectedPage(<Customers />, getProtectedRoutePermission('/clientes')) },
  { path: '/ventas', element: protectedPage(<Sales />, getProtectedRoutePermission('/ventas')) },
  { path: '/empleados', element: protectedPage(<Employees />, getProtectedRoutePermission('/empleados')) },
  { path: '/roles', element: protectedPage(<Roles />, getProtectedRoutePermission('/roles')) },
  { path: '/metodos-pago', element: protectedPage(<PaymentMethods />, getProtectedRoutePermission('/metodos-pago')) },
  { path: '/configuracion', element: protectedPage(<CompanySettings />, getProtectedRoutePermission('/configuracion')) },
  { path: '/auditoria', element: protectedPage(<Audit />, getProtectedRoutePermission('/auditoria')) },
  { path: '/seguridad', element: protectedPage(<Security />, getProtectedRoutePermission('/seguridad')) },
  { path: '/perfil', element: protectedPage(<Profile />) },
]);
