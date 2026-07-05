import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router';
import { useProductos } from '../../hooks/useProductos';
import { useClientes } from '../../hooks/useClientes';
import { usePedidos } from '../../hooks/usePedidos';
import { useCaja } from '../../hooks/useCaja';
import { usePrivateQueryEnabled } from '../../hooks/usePrivateQuery';
import { productosApi } from '../../api/productos';
import { extrasApi, ExtraProducto } from '../../api/extras';
import { toast } from '../../lib/notifications';
import { getFullImageUrl } from '../components/ui/utils';
import {
  CartItem,
  CashMovement,
  CashRegister,
  Customer,
  ERPContext,
  Order,
  Product,
} from './ERPContextValue';

const EMPTY_ARRAY: ExtraProducto[] = [];
let localCartSequence = 0;

const createCartItemId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  localCartSequence += 1;
  return `cart-${localCartSequence}`;
};

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

const resolveCashMovementMethod = (concepto?: string): CashMovement['method'] => {
  const normalizedConcept = concepto?.toLowerCase() ?? '';

  if (normalizedConcept.includes('tarjeta')) {
    return 'tarjeta';
  }

  if (normalizedConcept.includes('yape')) {
    return 'yape';
  }

  if (normalizedConcept.includes('plin')) {
    return 'plin';
  }

  return 'efectivo';
};

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const queryEnabled = usePrivateQueryEnabled();
  const pedidosPollingEnabled = location.pathname === '/cocina' || location.pathname === '/pedidos';

  // 1. Consume hooks de React Query conectados al backend
  const { productos } = useProductos();
  const { clientes, createCliente } = useClientes();
  const { pedidos, updateEstadoPedido } = usePedidos({ pollingEnabled: pedidosPollingEnabled });
  const { cajaActiva, movimientos, abrirCaja, cerrarCaja, registrarMovimiento } = useCaja();

  // Local states
  const [cart, setCart] = useState<CartItem[]>([]);

  // Prefetch extras and derive POS options from real child SKUs.
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
      type ProductoApi = (typeof productos)[number];
      const skuChildrenByParent = new Map<number, ProductoApi[]>();
      for (const producto of productos) {
        if (producto.esSku !== false && producto.idProductoPadre) {
          const current = skuChildrenByParent.get(producto.idProductoPadre) || [];
          current.push(producto);
          skuChildrenByParent.set(producto.idProductoPadre, current);
        }
      }

      const items: Product[] = await Promise.all(
        productos.map(async p => {
          const variants: Product['variants'] = (skuChildrenByParent.get(p.idProducto) || []).map(sku => {
            const stock = sku.stockActual ?? sku.stockTotal ?? (sku.tipoProducto === 'PREPARADO' ? Number.MAX_SAFE_INTEGER : 0);
            return {
              name: sku.nombre,
              price: sku.precio,
              skuProductId: sku.idProducto,
              skuCode: sku.sku,
              stock,
              type: sku.tipoProducto,
              active: sku.estado === 'ACTIVO',
              isAvailable: sku.estado === 'ACTIVO' && stock > 0,
            };
          });

          // Extras are global add-ons for prepared products only. Direct inventory
          // products should not inherit them because they are sold as stock items.
          const mappedExtras = p.tipoProducto === 'PREPARADO'
            ? allExtras
                .filter(e => e.estado !== 'INACTIVO' && e.idInsumo && e.cantidadConsumida > 0)
                .map(e => ({
                  name: e.nombre,
                  price: e.precio,
                }))
            : [];

          // Fetch stock if available
          let stock = p.tipoProducto === 'INVENTARIO_DIRECTO'
            ? p.stockActual ?? p.stockTotal ?? 0
            : Number.MAX_SAFE_INTEGER;
          try {
            const detail = await queryClient.fetchQuery({
              queryKey: ['productos', p.idProducto],
              queryFn: () => productosApi.getById(p.idProducto),
            });
            stock = p.tipoProducto === 'INVENTARIO_DIRECTO'
              ? detail.producto.stockActual ?? detail.producto.stockTotal ?? detail.inventario?.stock ?? 0
              : Number.MAX_SAFE_INTEGER;
          } catch {
            // default stock
          }

          const availableVariantPrices = (variants || [])
            .filter(variant => variant.isAvailable)
            .map(variant => variant.price);
          const displayPrice = p.esSku === false && availableVariantPrices.length
            ? Math.min(...availableVariantPrices)
            : p.precio;

          return {
            id: String(p.idProducto),
            name: p.nombre,
            category: p.nombreCategoria?.toLowerCase() || 'general',
            price: displayPrice,
            image: p.imagenUrl ? getFullImageUrl(p.imagenUrl) : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
            stock,
            type: p.tipoProducto,
            sku: p.sku,
            parentProductId: p.idProductoPadre ? String(p.idProductoPadre) : undefined,
            isCatalogParent: p.esSku === false,
            variants: variants.length > 0 ? variants : undefined,
            extras: mappedExtras.length > 0 ? mappedExtras : undefined,
          };
        })
      );
      setMappedProducts(items.filter(item => item.isCatalogParent && !!item.variants?.length));
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
          BORRADOR_ATENCION: 'pendiente',
          EN_COCINA: 'en-cocina',
          LISTO: 'listo',
          SERVIDO: 'entregado',
          CUENTA: 'entregado',
          CERRADO: 'entregado',
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
  }, [pedidos, mappedCustomers]);

  // Map active box to context CashRegister
  const mappedCashRegister: CashRegister | null = useMemo(() => {
    if (!cajaActiva) return null;

    return {
      id: String(cajaActiva.idCaja),
      openedAt: new Date(cajaActiva.fechaApertura),
      closedAt: cajaActiva.fechaCierre ? new Date(cajaActiva.fechaCierre) : undefined,
      openingBalance: cajaActiva.montoApertura,
      currentBalance: cajaActiva.saldoEsperado ?? cajaActiva.montoApertura,
      status: cajaActiva.estado === 'ABIERTA' ? 'abierta' : 'cerrada',
      movements: movimientos.map(m => ({
        id: String(m.idMovimiento),
        type: m.tipo.toLowerCase() as 'ingreso' | 'egreso',
        amount: m.monto,
        description: m.concepto,
        method: resolveCashMovementMethod(m.concepto),
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        comprobante: m.comprobante,
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
      const variantMeta = product.variants?.find(v => v.skuProductId === existingItem.variantSkuProductId || v.name === existingItem.variant);
      if (variantMeta && existingItem.quantity + 1 > variantMeta.stock) {
        toast.warning(`No hay suficiente stock. Solo quedan ${variantMeta.stock} unidades de ${variantMeta.name}`);
        return;
      }
      if (!product.isCatalogParent && product.type === 'INVENTARIO_DIRECTO' && existingItem.quantity + 1 > product.stock) {
        toast.warning(`No hay suficiente stock. Solo quedan ${product.stock} unidades de ${product.name}`);
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex] = { ...existingItem, quantity: existingItem.quantity + 1 };
      setCart(newCart);
      toast.success(`Se aumentó la cantidad de ${product.name}`);
      return;
    }

    if (!product.isCatalogParent && product.type === 'INVENTARIO_DIRECTO' && product.stock <= 0) {
      toast.warning(`El producto ${product.name} está agotado`);
      return;
    }

    const variantMeta = variant ? product.variants?.find(v => v.name === variant) : undefined;
    if (product.isCatalogParent && !variantMeta?.skuProductId) {
      toast.warning('Selecciona un SKU válido antes de agregar al pedido');
      return;
    }
    if (variantMeta && !variantMeta.isAvailable) {
      toast.warning(`La opción ${variantMeta.name} no tiene stock disponible`);
      return;
    }
    const variantPrice = variant 
      ? variantMeta?.price || product.price
      : product.price;
    
    const extrasPrice = extras 
      ? extras.reduce((sum, extra) => {
          const extraPrice = product.extras?.find(e => e.name === extra)?.price || 0;
          return sum + extraPrice;
        }, 0)
      : 0;

    const newItem: CartItem = {
      id: createCartItemId(),
      productId: product.id,
      name: product.name,
      price: variantPrice + extrasPrice,
      quantity: 1,
      variant,
      variantId: variantMeta?.id,
      variantSkuProductId: variantMeta?.skuProductId,
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
      const variantMeta = prod?.variants?.find(v => v.skuProductId === item.variantSkuProductId || v.name === item.variant);
      if (variantMeta && quantity > variantMeta.stock) {
        toast.warning(`No hay suficiente stock. Solo quedan ${variantMeta.stock} unidades de ${variantMeta.name}`);
        return;
      }
      if (prod && !prod.isCatalogParent && prod.type === 'INVENTARIO_DIRECTO' && quantity > prod.stock) {
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

  // API Integration: Update Order Status
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const statusMap: Record<Order['status'], string> = {
      pendiente: 'BORRADOR_ATENCION',
      'en-cocina': 'EN_COCINA',
      listo: 'LISTO',
      entregado: 'SERVIDO',
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
          referenceType: movement.referenceType || 'MOVIMIENTO_MANUAL',
          referenceId: movement.referenceId || cajaActiva.idCaja,
          comprobante: movement.comprobante || `MOV-CAJA-${cajaActiva.idCaja}`,
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
        cashRegister: mappedCashRegister,
        customers: mappedCustomers,
        createCustomer,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        updateOrderStatus,
        openCashRegister,
        closeCashRegister,
        addCashMovement,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
}
