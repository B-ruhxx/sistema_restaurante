import { createContext, useContext } from 'react';
import type { ClienteTipoDocumento } from '../../api/clientes';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  type: 'PREPARADO' | 'INVENTARIO_DIRECTO';
  sku?: string;
  parentProductId?: string;
  isCatalogParent?: boolean;
  variants?: {
    id?: number;
    name: string;
    price: number;
    skuProductId?: number;
    skuCode?: string;
    stock: number;
    type: 'PREPARADO' | 'INVENTARIO_DIRECTO';
    active: boolean;
    isAvailable: boolean;
  }[];
  extras?: { name: string; price: number }[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  variantId?: number;
  variantSkuProductId?: number;
  extras?: string[];
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  customer?: Customer;
  status: 'pendiente' | 'en-cocina' | 'listo' | 'entregado' | 'cancelado';
  total: number;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  priority?: 'alta' | 'media' | 'baja';
}

export interface Customer {
  id: string;
  name: string;
  documentType: ClienteTipoDocumento;
  documentNumber: string;
  email?: string;
  phone?: string;
}

export interface CashRegister {
  id: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  currentBalance: number;
  status: 'abierta' | 'cerrada';
  movements: CashMovement[];
}

export interface CashMovement {
  id: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  description: string;
  method: 'efectivo' | 'tarjeta' | 'yape' | 'plin';
  orderId?: string;
  referenceType?: string;
  referenceId?: number;
  comprobante?: string;
  createdAt: Date;
}

export interface ERPContextType {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  cashRegister: CashRegister | null;
  customers: Customer[];
  createCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  addToCart: (product: Product, variant?: string, extras?: string[], notes?: string) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  openCashRegister: (openingBalance: number, observacion?: string) => Promise<void>;
  closeCashRegister: (montoCierre: number, observacion?: string) => Promise<void>;
  addCashMovement: (movement: Omit<CashMovement, 'id' | 'createdAt'>) => Promise<void>;
}

export const ERPContext = createContext<ERPContextType | undefined>(undefined);

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within ERPProvider');
  }
  return context;
}
