import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
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

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/', element: <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute> },
  { path: '/pos', element: <ProtectedRoute><Layout><POS /></Layout></ProtectedRoute> },
  { path: '/checkout', element: <ProtectedRoute><Layout><Checkout /></Layout></ProtectedRoute> },
  { path: '/pedidos', element: <ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute> },
  { path: '/cocina', element: <ProtectedRoute><Layout><Kitchen /></Layout></ProtectedRoute> },
  { path: '/caja', element: <ProtectedRoute><Layout><CashRegister /></Layout></ProtectedRoute> },
  // Fase 2
  { path: '/categorias', element: <ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute> },
  { path: '/productos', element: <ProtectedRoute><Layout><Products /></Layout></ProtectedRoute> },
  { path: '/combos', element: <ProtectedRoute><Layout><Combos /></Layout></ProtectedRoute> },
  { path: '/extras', element: <ProtectedRoute><Layout><ProductExtras /></Layout></ProtectedRoute> },
  { path: '/recetas', element: <ProtectedRoute><Layout><RecipeBuilder /></Layout></ProtectedRoute> },
  { path: '/insumos', element: <ProtectedRoute><Layout><Supplies /></Layout></ProtectedRoute> },
  { path: '/kardex', element: <ProtectedRoute><Layout><Kardex /></Layout></ProtectedRoute> },
  { path: '/inventario', element: <ProtectedRoute><Layout><DirectInventory /></Layout></ProtectedRoute> },
  { path: '/proveedores', element: <ProtectedRoute><Layout><Suppliers /></Layout></ProtectedRoute> },
  { path: '/compras', element: <ProtectedRoute><Layout><Purchases /></Layout></ProtectedRoute> },
  // Fase 3 - Administración
  { path: '/dashboard-gerencial', element: <ProtectedRoute><Layout><ExecutiveDashboard /></Layout></ProtectedRoute> },
  { path: '/reportes', element: <ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute> },
  { path: '/clientes', element: <ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute> },
  { path: '/empleados', element: <ProtectedRoute><Layout><Employees /></Layout></ProtectedRoute> },
  { path: '/roles', element: <ProtectedRoute><Layout><Roles /></Layout></ProtectedRoute> },
  { path: '/metodos-pago', element: <ProtectedRoute><Layout><PaymentMethods /></Layout></ProtectedRoute> },
  { path: '/configuracion', element: <ProtectedRoute><Layout><CompanySettings /></Layout></ProtectedRoute> },
  { path: '/auditoria', element: <ProtectedRoute><Layout><Audit /></Layout></ProtectedRoute> },
  { path: '/seguridad', element: <ProtectedRoute><Layout><Security /></Layout></ProtectedRoute> },
]);
