import type React from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ERPProvider } from './contexts/ERPContext';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Tables } from './pages/Tables';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { Kitchen } from './pages/Kitchen';
import { CashRegister } from './pages/CashRegister';
import { Categories } from './pages/Categories';
import { Products } from './pages/Products';
import { RecipeBuilder } from './pages/RecipeBuilder';
import { Supplies } from './pages/Supplies';
import { Kardex } from './pages/Kardex';
import { DirectInventory } from './pages/DirectInventory';
import { Suppliers } from './pages/Suppliers';
import { Purchases } from './pages/Purchases';
import { Combos } from './pages/Combos';
import { Customers } from './pages/Customers';
import { Employees } from './pages/Employees';
import { Roles } from './pages/Roles';
import { PaymentMethods } from './pages/PaymentMethods';
import { ProductExtras } from './pages/ProductExtras';
import { Reports } from './pages/Reports';
import { Audit } from './pages/Audit';
import { CompanySettings } from './pages/CompanySettings';
import { Security } from './pages/Security';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';

const protectedPage = (page: React.ReactNode) => (
  <ProtectedRoute>
    <ERPProvider>
      <Layout>{page}</Layout>
    </ERPProvider>
  </ProtectedRoute>
);

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/', element: protectedPage(<Dashboard />) },
  { path: '/mesas', element: protectedPage(<Tables />) },
  { path: '/pos', element: protectedPage(<POS />) },
  { path: '/checkout', element: protectedPage(<Checkout />) },
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
  { path: '/empleados', element: protectedPage(<Employees />) },
  { path: '/roles', element: protectedPage(<Roles />) },
  { path: '/metodos-pago', element: protectedPage(<PaymentMethods />) },
  { path: '/configuracion', element: protectedPage(<CompanySettings />) },
  { path: '/auditoria', element: protectedPage(<Audit />) },
  { path: '/seguridad', element: protectedPage(<Security />) },
]);
