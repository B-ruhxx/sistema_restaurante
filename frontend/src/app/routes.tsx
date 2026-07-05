import type React from 'react';
import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
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

const protectedPage = (page: React.ReactNode) => (
  <ProtectedRoute>
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
  { path: '/mesas', element: protectedPage(<Tables />) },
  { path: '/pos', element: protectedPage(<POS />) },
  { path: '/pedidos', element: protectedPage(<Orders />) },
  { path: '/cocina', element: protectedPage(<Kitchen />) },
  { path: '/caja', element: protectedPage(<CashRegister />) },
  // Fase 2
  { path: '/categorias', element: protectedPage(<Categories />) },
  { path: '/productos', element: protectedPage(<Products />) },
  { path: '/combos', element: protectedPage(<Combos />) },
  { path: '/extras', element: protectedPage(<ProductExtras />) },
  { path: '/recetas', element: protectedPage(<RecipeBuilder />) },
  { path: '/insumos', element: protectedPage(<Supplies />) },
  { path: '/kardex', element: protectedPage(<Kardex />) },
  { path: '/inventario', element: protectedPage(<DirectInventory />) },
  { path: '/proveedores', element: protectedPage(<Suppliers />) },
  { path: '/compras', element: protectedPage(<Purchases />) },
  // Fase 3 - Administración
  { path: '/dashboard-gerencial', element: protectedPage(<ExecutiveDashboard />) },
  { path: '/reportes', element: protectedPage(<Reports />) },
  { path: '/clientes', element: protectedPage(<Customers />) },
  { path: '/ventas', element: protectedPage(<Sales />) },
  { path: '/empleados', element: protectedPage(<Employees />) },
  { path: '/roles', element: protectedPage(<Roles />) },
  { path: '/metodos-pago', element: protectedPage(<PaymentMethods />) },
  { path: '/configuracion', element: protectedPage(<CompanySettings />) },
  { path: '/auditoria', element: protectedPage(<Audit />) },
  { path: '/seguridad', element: protectedPage(<Security />) },
  { path: '/perfil', element: protectedPage(<Profile />) },
]);
