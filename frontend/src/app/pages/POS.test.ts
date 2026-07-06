import { describe, expect, it } from 'vitest';
import type { Product } from '../contexts/ERPContextValue';
import { buildCartAddition } from '../contexts/cart-utils';
import {
  formatPrice,
  getPriceConfigurationLabel,
  getProductSelectionBlockReason,
  getVariantLabel,
  isExtraSelectable,
  isVariantSelectable,
  resolveProductSelection,
} from './pos-utils';

const baseProduct: Product = {
  id: '1',
  name: 'Pizza',
  category: 'pizzas',
  price: 25,
  image: 'pizza.jpg',
  stock: Number.MAX_SAFE_INTEGER,
  type: 'PREPARADO',
  isCatalogParent: false,
};

describe('formatPrice', () => {
  it('formats a valid number with S/ prefix and 2 decimals', () => {
    expect(formatPrice(25.5)).toBe('S/ 25.50');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('S/ 0.00');
  });

  it('returns em dash for null', () => {
    expect(formatPrice(null)).toBe('—');
  });

  it('returns em dash for undefined', () => {
    expect(formatPrice(undefined)).toBe('—');
  });
});

describe('POS price validation flow', () => {
  it('blocks a variant with null price before it enters the cart', () => {
    const product: Product = {
      ...baseProduct,
      price: null,
      isCatalogParent: true,
      variants: [
        {
          name: 'Familiar',
          price: null,
          skuProductId: 101,
          stock: 8,
          type: 'PREPARADO',
          active: true,
          isAvailable: true,
        },
      ],
    };

    expect(getProductSelectionBlockReason(product)).toBe('No hay SKUs con precio configurado para este producto');
    expect(isVariantSelectable(product.variants![0])).toBe(false);
    expect(getVariantLabel(product.variants![0])).toBe('Precio no configurado');

    const selection = resolveProductSelection(product, 'Familiar');
    expect(selection.ok).toBe(false);
    if (selection.ok) {
      throw new Error('Expected invalid selection to be blocked');
    }
    expect(selection.message).toBe('El SKU Familiar no tiene precio configurado');
  });

  it('blocks an extra with null price before it is added', () => {
    const product: Product = {
      ...baseProduct,
      extras: [
        { name: 'Borde de queso', price: null },
      ],
    };

    expect(isExtraSelectable(product.extras![0])).toBe(false);
    expect(getPriceConfigurationLabel(product.extras![0].price)).toBe('Precio no configurado');

    const selection = resolveProductSelection(product, undefined, ['Borde de queso']);
    expect(selection.ok).toBe(false);
    if (selection.ok) {
      throw new Error('Expected invalid extra to be blocked');
    }
    expect(selection.message).toBe('El extra Borde de queso no tiene precio configurado');
  });

  it('allows a valid product to enter the cart with its real total', () => {
    const product: Product = {
      ...baseProduct,
      extras: [
        { name: 'Extra tocino', price: 3.5 },
      ],
    };

    const selection = resolveProductSelection(product, undefined, ['Extra tocino']);
    expect(selection.ok).toBe(true);
    if (!selection.ok) {
      throw new Error('Expected valid product to be accepted');
    }
    expect(selection.totalPrice).toBe(28.5);
    expect(formatPrice(selection.totalPrice)).toBe('S/ 28.50');
  });

  it('never substitutes null prices with S/ 0.00 in blocked flows', () => {
    const product: Product = {
      ...baseProduct,
      price: null,
    };

    const selection = resolveProductSelection(product);
    expect(selection.ok).toBe(false);
    expect(getPriceConfigurationLabel(product.price)).toBe('Precio no configurado');
    expect(formatPrice(product.price)).toBe('—');
    expect(formatPrice(product.price)).not.toBe('S/ 0.00');
  });

  it('keeps cart unchanged when addToCart guard receives a null-price variant directly', () => {
    const product: Product = {
      ...baseProduct,
      price: null,
      isCatalogParent: true,
      variants: [
        {
          name: 'Personal',
          price: null,
          skuProductId: 201,
          stock: 4,
          type: 'PREPARADO',
          active: true,
          isAvailable: true,
        },
      ],
    };
    const cart = [{
      id: 'existing',
      productId: 'existing-product',
      name: 'Producto existente',
      price: 12,
      quantity: 1,
    }];

    const result = buildCartAddition(cart, product, 'Personal', [], undefined, () => 'new-item');

    expect(result.ok).toBe(false);
    expect(result.cart).toEqual(cart);
    expect(result.cart).toHaveLength(1);
    expect(result.cart[0].price).toBe(12);
  });
});
