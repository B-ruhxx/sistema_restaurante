import type { CartItem, Product } from './ERPContextValue';
import { resolveProductSelection } from '../pages/pos-utils';

export type CartAdditionResult =
  | { ok: false; message: string; cart: CartItem[] }
  | { ok: true; message: string; cart: CartItem[] };

const usesDirectInventoryStock = (product: Product): boolean =>
  product.type === 'INVENTARIO_DIRECTO' && !product.variants?.length;

export const buildCartAddition = (
  cart: CartItem[],
  product: Product,
  variant: string | undefined,
  extras: string[] = [],
  notes: string | undefined,
  createId: () => string
): CartAdditionResult => {
  const selection = resolveProductSelection(product, variant, extras);
  if (!selection.ok) {
    return { ok: false, message: selection.message, cart };
  }

  const existingIndex = cart.findIndex(item =>
    item.productId === product.id &&
    item.variant === variant &&
    JSON.stringify(item.extras || []) === JSON.stringify(extras)
  );

  if (existingIndex > -1) {
    const existingItem = cart[existingIndex];
    const variantMeta = product.variants?.find(v => v.skuProductId === existingItem.variantSkuProductId || v.name === existingItem.variant);
    if (variantMeta && existingItem.quantity + 1 > variantMeta.stock) {
      return { ok: false, message: `No hay suficiente stock. Solo quedan ${variantMeta.stock} unidades de ${variantMeta.name}`, cart };
    }
    if (usesDirectInventoryStock(product) && existingItem.quantity + 1 > product.stock) {
      return { ok: false, message: `No hay suficiente stock. Solo quedan ${product.stock} unidades de ${product.name}`, cart };
    }
    const nextCart = [...cart];
    nextCart[existingIndex] = { ...existingItem, quantity: existingItem.quantity + 1 };
    return { ok: true, message: `Se aumentó la cantidad de ${product.name}`, cart: nextCart };
  }

  if (usesDirectInventoryStock(product) && product.stock <= 0) {
    return { ok: false, message: `El producto ${product.name} está sin stock`, cart };
  }

  const variantMeta = variant ? product.variants?.find(v => v.name === variant) : undefined;
  if (product.variants?.length && !variantMeta?.skuProductId) {
    return { ok: false, message: 'Selecciona un SKU válido antes de agregar al pedido', cart };
  }
  if (variantMeta && !variantMeta.isAvailable) {
    return { ok: false, message: `La opción ${variantMeta.name} no tiene stock disponible`, cart };
  }

  return {
    ok: true,
    message: `Se agregó ${product.name} al pedido`,
    cart: [
      ...cart,
      {
        id: createId(),
        productId: product.id,
        name: product.name,
        price: selection.totalPrice,
        quantity: 1,
        variant,
        variantId: variantMeta?.id,
        variantSkuProductId: variantMeta?.skuProductId,
        extras,
        notes,
      },
    ],
  };
};

export const productUsesDirectInventoryStock = usesDirectInventoryStock;
