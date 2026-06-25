import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router';
import { useProductos } from '../../hooks/useProductos';
import { useClientes } from '../../hooks/useClientes';
import { usePedidos } from '../../hooks/usePedidos';
import { useVentas } from '../../hooks/useVentas';
import { useCaja } from '../../hooks/useCaja';
import { usePrivateQueryEnabled } from '../../hooks/usePrivateQuery';
import { productosApi } from '../../api/productos';
import { clientesApi } from '../../api/clientes';
import { pedidosApi } from '../../api/pedidos';
import { ventasApi } from '../../api/ventas';
import { metodoPagosApi, MetodoPago } from '../../api/metodoPagos';
import { extrasApi, ExtraProducto } from '../../api/extras';
import { variantesApi } from '../../api/variantes';
import { cajasApi } from '../../api/cajas';
import { toast } from '../../lib/notifications';
import { getFullImageUrl } from '../components/ui/utils';

const EMPTY_ARRAY: any[] = [];

// Tipos del contexto original (legacy)
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  type: 'PREPARADO' | 'INVENTARIO_DIRECTO';
  variants?: { name: string; price: number }[];
  extras?: { name: string; price: number }[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
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
  documentType: 'DNI' | 'RUC';
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
  createdAt: Date;
}

interface ERPContextType {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  currentOrder: Order | null;
  cashRegister: CashRegister | null;
  customers: Customer[];
  createCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  addToCart: (product: Product, variant?: string, extras?: string[], notes?: string) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  createOrder: (customer?: Customer, paymentMethod?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  openCashRegister: (openingBalance: number, observacion?: string) => Promise<void>;
  closeCashRegister: (montoCierre: number, observacion?: string) => Promise<void>;
  addCashMovement: (movement: Omit<CashMovement, 'id' | 'createdAt'>) => Promise<void>;
  setCurrentOrder: (order: Order | null) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const mapClienteToCustomer = (cliente: {
  idCliente: number;
  nombre: string;
  apellido?: string;
  tipoDocumento?: string;
  documentoIdentidad: string;
  email?: string;
  telefono?: string;
}): Customer => ({
  id: String(cliente.idCliente),
  name: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
  documentType: cliente.tipoDocumento === 'RUC' ? 'RUC' : 'DNI',
  documentNumber: cliente.documentoIdentidad,
  email: cliente.email,
  phone: cliente.telefono,
});

const splitCustomerName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    nombre: parts[0] || 'Cliente',
    apellido: parts.slice(1).join(' ') || 'Genérico',
  };
};

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const queryEnabled = usePrivateQueryEnabled();
  const pedidosPollingEnabled = location.pathname === '/cocina' || location.pathname === '/pedidos';

  // 1. Consume hooks de React Query conectados al backend
  const { productos } = useProductos();
  const { clientes, createCliente } = useClientes();
  const { pedidos, createPedido, updateEstadoPedido } = usePedidos({ pollingEnabled: pedidosPollingEnabled });
  const { createVenta, pagarVenta } = useVentas();
  const { cajaActiva, movimientos, abrirCaja, cerrarCaja, registrarMovimiento } = useCaja();

  // Local states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Prefetch variants and extras dynamically for mapping absolute prices and options
  const { data: allExtras = EMPTY_ARRAY } = useQuery<ExtraProducto[]>({
    queryKey: ['extras'],
    queryFn: extrasApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  // Map backend Productos to context Products
  const [mappedProducts, setMappedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadProductsData = async () => {
      if (!productos || productos.length === 0) return;

      const items: Product[] = await Promise.all(
        productos.map(async p => {
          // Fetch variants for this product
          let variants: { name: string; price: number }[] = [];
          try {
            const vars = await queryClient.fetchQuery({
              queryKey: ['variantes', p.idProducto],
              queryFn: () => variantesApi.getByProducto(p.idProducto),
            });
            variants = vars.map(v => ({
              name: v.nombre,
              price: p.precio + v.precioExtra,
            }));
          } catch {
            // no variants
          }

          // Extras are global add-ons for prepared products only. Direct inventory
          // products should not inherit them because they are sold as stock items.
          const mappedExtras = p.tipoProducto === 'PREPARADO' ? allExtras.map(e => ({
            name: e.nombre,
            price: e.precio,
          })) : [];

          // Fetch stock if available
          let stock = 10;
          try {
            const detail = await queryClient.fetchQuery({
              queryKey: ['productos', p.idProducto],
              queryFn: () => productosApi.getById(p.idProducto),
            });
            stock = detail.inventario?.stock ?? 10;
          } catch {
            // default stock
          }

          return {
            id: String(p.idProducto),
            name: p.nombre,
            category: p.nombreCategoria?.toLowerCase() || 'general',
            price: p.precio,
            image: p.imagenUrl ? getFullImageUrl(p.imagenUrl) : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
            stock,
            type: p.tipoProducto,
            variants: variants.length > 0 ? variants : undefined,
            extras: mappedExtras.length > 0 ? mappedExtras : undefined,
          };
        })
      );
      setMappedProducts(items);
    };

    loadProductsData();
  }, [productos, allExtras, queryClient]);

  // Map backend Clientes to context Customers
  const mappedCustomers: Customer[] = useMemo(() => {
    return clientes.map(mapClienteToCustomer);
  }, [clientes]);

  // Map backend Pedidos to context Orders
  const [mappedOrders, setMappedOrders] = useState<Order[]>([]);

  useEffect(() => {
    const mapOrders = () => {
      const items: Order[] = pedidos.map(p => {
        const statusMap: Record<string, Order['status']> = {
          ABIERTO: 'pendiente',
          PENDIENTE: 'pendiente',
          ENVIADO_COCINA: 'en-cocina',
          EN_PREPARACION: 'en-cocina',
          CUENTA_SOLICITADA: 'entregado',
          CUENTA_EMITIDA: 'entregado',
          PAGADO: 'entregado',
          EN_PROCESO: 'en-cocina',
          EN_COCINA: 'en-cocina',
          LISTO: 'listo',
          ENTREGADO: 'entregado',
          CANCELADO: 'cancelado',
        };

        const mappedItems: CartItem[] = (p.detalles || []).map(d => ({
          id: String(d.idDetallePedido),
          productId: String(d.idProducto),
          name: d.nombreProducto || 'Producto',
          price: d.precioUnitario,
          quantity: d.cantidad,
          variant: d.nombreVariante,
          extras: (d.extras || []).map(e => e.nombre),
          notes: d.observacion,
        }));

        const total = mappedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return {
          id: String(p.idPedido),
          orderNumber: `ORD-${String(p.idPedido).padStart(3, '0')}`,
          items: mappedItems,
          customer: p.idCliente ? mappedCustomers.find(c => Number(c.id) === p.idCliente) : undefined,
          status: statusMap[p.estado] || 'pendiente',
          total,
          createdAt: new Date(p.fecha),
          updatedAt: new Date(p.fecha),
        };
      });
      setMappedOrders(items);
    };

    mapOrders();
  }, [pedidos, clientes]);

  // Map active box to context CashRegister
  const mappedCashRegister: CashRegister | null = useMemo(() => {
    if (!cajaActiva) return null;
    
    const methodMap: Record<string, CashMovement['method']> = {
      tarjeta: 'tarjeta',
      yape: 'yape',
      plin: 'plin',
    };

    return {
      id: String(cajaActiva.idCaja),
      openedAt: new Date(cajaActiva.fechaApertura),
      closedAt: cajaActiva.fechaCierre ? new Date(cajaActiva.fechaCierre) : undefined,
      openingBalance: cajaActiva.montoApertura,
      currentBalance: cajaActiva.saldoEsperado ?? cajaActiva.montoApertura,
      status: cajaActiva.estado === 'ABIERTA' ? 'abierta' : 'cerrada',
      movements: movimientos.map(m => ({
        id: String(m.idMovimientoCaja),
        type: m.tipo.toLowerCase() as 'ingreso' | 'egreso',
        amount: m.monto,
        description: m.concepto,
        method: methodMap[m.concepto.toLowerCase()] || 'efectivo',
        createdAt: new Date(m.fecha),
      })),
    };
  }, [cajaActiva, movimientos]);

  // Cart operations
  const addToCart = (product: Product, variant?: string, extras?: string[], notes?: string) => {
    // Check if the item already exists in the cart (same product, variant, and extras)
    const existingIndex = cart.findIndex(item => 
      item.productId === product.id && 
      item.variant === variant && 
      JSON.stringify(item.extras || []) === JSON.stringify(extras || [])
    );

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      if (existingItem.quantity + 1 > product.stock) {
        toast.warning(`No hay suficiente stock. Solo quedan ${product.stock} unidades de ${product.name}`);
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex] = { ...existingItem, quantity: existingItem.quantity + 1 };
      setCart(newCart);
      toast.success(`Se aumentó la cantidad de ${product.name}`);
      return;
    }

    if (product.stock <= 0) {
      toast.warning(`El producto ${product.name} está agotado`);
      return;
    }

    const variantPrice = variant 
      ? product.variants?.find(v => v.name === variant)?.price || product.price
      : product.price;
    
    const extrasPrice = extras 
      ? extras.reduce((sum, extra) => {
          const extraPrice = product.extras?.find(e => e.name === extra)?.price || 0;
          return sum + extraPrice;
        }, 0)
      : 0;

    const newItem: CartItem = {
      id: `${Date.now()}-${Math.random()}`,
      productId: product.id,
      name: product.name,
      price: variantPrice + extrasPrice,
      quantity: 1,
      variant,
      extras,
      notes
    };

    setCart([...cart, newItem]);
    toast.success(`Se agregó ${product.name} al pedido`);
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const item = cart.find(i => i.id === itemId);
    if (item) {
      const prod = mappedProducts.find(p => p.id === item.productId);
      if (prod && quantity > prod.stock) {
        toast.warning(`No hay suficiente stock. Solo quedan ${prod.stock} unidades de ${prod.name}`);
        return;
      }
    }
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const createCustomer = async (customer: Omit<Customer, 'id'>) => {
    const cleanDoc = customer.documentNumber.trim();
    const existing = clientes.find(c => c.documentoIdentidad === cleanDoc);
    if (existing) return mapClienteToCustomer(existing);

    const { nombre, apellido } = splitCustomerName(customer.name);
    const created = await createCliente({
      nombre,
      apellido,
      tipoDocumento: customer.documentType === 'RUC' ? 'RUC' : 'DNI',
      documentoIdentidad: cleanDoc,
      email: customer.email,
      telefono: customer.phone,
      estado: 'ACTIVO',
    });

    return mapClienteToCustomer(created);
  };

  // API Integration: Create Order
  const createOrder = async (customer?: Customer, paymentMethod?: string) => {
    // 1. Resolve or create customer in backend
    let idCliente: number | undefined = undefined;
    if (customer) {
      const cleanDoc = customer.documentNumber.trim();
      const existing = clientes.find(c => c.documentoIdentidad === cleanDoc);
      if (existing) {
        idCliente = existing.idCliente;
      } else {
        const newCustomer = await createCustomer(customer);
        idCliente = Number(newCustomer.id);
      }
    }

    // 2. Map cart to backend DetallePedidoRequest
    const detalles = await Promise.all(cart.map(async item => {
      let idVariante: number | undefined = undefined;
      if (item.variant) {
        try {
          const vars = await queryClient.fetchQuery({
            queryKey: ['variantes', Number(item.productId)],
            queryFn: () => variantesApi.getByProducto(Number(item.productId)),
          });
          const found = vars.find(v => v.nombre === item.variant);
          if (found) idVariante = found.idVariante;
        } catch {
          // ignore
        }
      }

      // Map extras to IDs
      const extrasIds: number[] = [];
      if (item.extras && item.extras.length > 0) {
        for (const exName of item.extras) {
          const found = allExtras.find(e => e.nombre === exName);
          if (found) extrasIds.push(found.idExtra);
        }
      }

      return {
        idProducto: Number(item.productId),
        cantidad: item.quantity,
        idVariante,
        observacion: item.notes,
        extrasIds,
      };
    }));

    // 3. Post Pedido to backend
    const pedido = await createPedido({
      idCliente,
      detalles,
    });

    // 4. Handle immediate payment/sale if payment method is provided
    if (paymentMethod && cajaActiva) {
      const activeMetodos = await queryClient.fetchQuery<MetodoPago[]>({
        queryKey: ['metodoPagos', 'activos'],
        queryFn: metodoPagosApi.getActivos,
      });

      const foundMethod = activeMetodos.find(m =>
        m.nombre.toLowerCase().includes(paymentMethod.toLowerCase())
      ) ?? activeMetodos.find(m => m.nombre.toLowerCase() === 'efectivo') ?? activeMetodos[0];

      if (foundMethod) {
        const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
        // Register sale
        const venta = await createVenta({
          idPedido: pedido.idPedido,
          tipoComprobante: customer?.documentType === 'RUC' ? 'FACTURA' : 'BOLETA',
          pagos: [
            {
              idMetodoPago: foundMethod.idMetodoPago,
              monto: total,
            }
          ]
        });

        // Pay sale
        await pagarVenta({
          id: venta.idVenta,
          pagos: [
            {
              idMetodoPago: foundMethod.idMetodoPago,
              monto: venta.total,
            }
          ]
        });
      }
    }

    clearCart();

    // Set dynamic current order for visual success ticket
    const orderNum = `ORD-${String(pedido.idPedido).padStart(3, '0')}`;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCurrentOrder({
      id: String(pedido.idPedido),
      orderNumber: orderNum,
      items: cart,
      customer,
      status: 'pendiente',
      total,
      paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  // API Integration: Update Order Status
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const statusMap: Record<Order['status'], string> = {
      pendiente: 'ABIERTO',
      'en-cocina': 'ENVIADO_COCINA',
      listo: 'LISTO',
      entregado: 'ENTREGADO',
      cancelado: 'CANCELADO',
    };
    const backendStatus = statusMap[status];
    if (backendStatus) {
      await updateEstadoPedido({ id: Number(orderId), estado: backendStatus });
    }
  };

  // API Integration: Cash Register
  const openCashRegister = async (openingBalance: number, observacion?: string) => {
    await abrirCaja({ monto: openingBalance, observacion });
  };

  const closeCashRegister = async (montoCierre: number, observacion?: string) => {
    if (cajaActiva) {
      await cerrarCaja({ id: cajaActiva.idCaja, monto: montoCierre, observacion });
    }
  };

  const addCashMovement = async (movement: Omit<CashMovement, 'id' | 'createdAt'>) => {
    if (cajaActiva) {
      await registrarMovimiento({
        idCaja: cajaActiva.idCaja,
        data: {
          tipo: movement.type.toUpperCase() as 'INGRESO' | 'EGRESO',
          concepto: `${movement.description} [Método: ${movement.method}]`,
          monto: movement.amount,
        }
      });
    }
  };

  return (
    <ERPContext.Provider
      value={{
        products: mappedProducts,
        cart,
        orders: mappedOrders,
        currentOrder,
        cashRegister: mappedCashRegister,
        customers: mappedCustomers,
        createCustomer,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        createOrder,
        updateOrderStatus,
        openCashRegister,
        closeCashRegister,
        addCashMovement,
        setCurrentOrder
      }}
    >
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within ERPProvider');
  }
  return context;
}
