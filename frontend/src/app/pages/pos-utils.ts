import type { Product } from '../contexts/ERPContextValue';

type ProductVariant = NonNullable<Product['variants']>[number];
type ProductExtra = NonNullable<Product['extras']>[number];

type SelectionError = {
  ok: false;
  message: string;
};

type SelectionSuccess = {
  ok: true;
  totalPrice: number;
  variant?: ProductVariant;
  extras: ProductExtra[];
};

export type ProductSelectionResult = SelectionError | SelectionSuccess;

export const formatPrice = (value: number | null | undefined): string => {
  if (value == null) return '—';
  return `S/ ${value.toFixed(2)}`;
};

export const isPriceConfigured = (value: number | null | undefined): value is number => value != null;

export const getPriceConfigurationLabel = (value: number | null | undefined): string => {
  if (!isPriceConfigured(value)) return 'Precio no configurado';
  return formatPrice(value);
};

export const isVariantSelectable = (variant: ProductVariant): boolean =>
  variant.isAvailable && isPriceConfigured(variant.price);

export const isExtraSelectable = (extra: ProductExtra): boolean =>
  isPriceConfigured(extra.price);

export const getVariantLabel = (variant: ProductVariant): string => {
  if (!variant.isAvailable) return 'Agotado';
  return getPriceConfigurationLabel(variant.price);
};

export const getProductSelectionBlockReason = (product: Product): string | null => {
  if (product.variants?.length) {
    if (product.variants.some(isVariantSelectable)) return null;
    if (product.variants.some((variant) => variant.isAvailable)) {
      return 'No hay SKUs con precio configurado para este producto';
    }
    return 'No hay SKUs disponibles para este producto';
  }

  if (!isPriceConfigured(product.price)) {
    return `El producto ${product.name} no tiene precio configurado`;
  }

  return null;
};

export const resolveProductSelection = (
  product: Product,
  variantName?: string,
  extraNames: string[] = []
): ProductSelectionResult => {
  let basePrice: number;
  let selectedVariant: ProductVariant | undefined;

  if (product.variants?.length) {
    selectedVariant = product.variants.find((variant) => variant.name === variantName);
    if (!selectedVariant?.skuProductId) {
      return { ok: false, message: 'Selecciona un SKU valido antes de agregar al pedido' };
    }
    if (!selectedVariant.isAvailable) {
      return { ok: false, message: 'Selecciona un SKU con stock disponible' };
    }
    if (!isPriceConfigured(selectedVariant.price)) {
      return { ok: false, message: `El SKU ${selectedVariant.name} no tiene precio configurado` };
    }
    basePrice = selectedVariant.price;
  } else {
    if (!isPriceConfigured(product.price)) {
      return { ok: false, message: `El producto ${product.name} no tiene precio configurado` };
    }
    basePrice = product.price;
  }

  const selectedExtras: ProductExtra[] = [];
  let extrasTotal = 0;
  for (const extraName of extraNames) {
    const extra = product.extras?.find((candidate) => candidate.name === extraName);
    if (!extra) {
      return { ok: false, message: `El extra ${extraName} ya no esta disponible` };
    }
    if (!isPriceConfigured(extra.price)) {
      return { ok: false, message: `El extra ${extra.name} no tiene precio configurado` };
    }
    selectedExtras.push(extra);
    extrasTotal += extra.price;
  }

  return {
    ok: true,
    totalPrice: basePrice + extrasTotal,
    variant: selectedVariant,
    extras: selectedExtras,
  };
};
