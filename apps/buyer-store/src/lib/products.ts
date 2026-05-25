export const PRODUCT_CATEGORIES = [
  {
    label: "All products",
    value: "all",
    href: "/shop",
    blurb: "Curated pieces for dressing well and styling spaces.",
  },
  {
    label: "Clothing",
    value: "clothing",
    href: "/shop?category=clothing",
    blurb: "Tailored essentials and occasion-ready silhouettes.",
  },
  {
    label: "Wallpaper",
    value: "wallpaper",
    href: "/shop?category=wallpaper",
    blurb: "Statement murals and subtle textures for every room.",
  },
] as const;

export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number]["value"];

export interface BuyerProductVariant {
  sku: string;
  sizeOrDimension: string;
  color: string | null;
  additionalPrice: number;
  stockCount: number;
  label: string;
  price: number;
}

export interface BuyerProduct {
  _id: string;
  title: string;
  description: string;
  basePrice: number;
  category: string;
  stock: number;
  imageUrl: string | null;
  images: string[];
  variants: BuyerProductVariant[];
}

interface ProductVariantLike {
  sku?: string | null;
  sizeOrDimension?: string | null;
  color?: string | null;
  additionalPrice?: number | string | null;
  stockCount?: number | null;
}

interface ProductLike {
  _id?: string;
  id?: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  basePrice?: number | string | null;
  price?: number | string | null;
  category?: string | null;
  stock?: number | null;
  imageUrl?: string | null;
  images?: unknown;
  variants?: ProductVariantLike[] | null;
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeImages(images: ProductLike["images"], imageUrl?: string | null) {
  const normalizedImages = Array.isArray(images)
    ? images.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];

  if (normalizedImages.length > 0) {
    return normalizedImages;
  }

  return imageUrl ? [imageUrl] : [];
}

function normalizeStock(product: ProductLike) {
  if (typeof product.stock === "number" && Number.isFinite(product.stock)) {
    return Math.max(0, product.stock);
  }

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce((total, variant) => total + toNumber(variant?.stockCount), 0);
  }

  return 0;
}

function buildVariantLabel(variant: { sizeOrDimension: string; color: string | null }) {
  return variant.color ? `${variant.sizeOrDimension} / ${variant.color}` : variant.sizeOrDimension;
}

function normalizeVariants(product: ProductLike, basePrice: number) {
  if (!Array.isArray(product.variants)) {
    return [];
  }

  return product.variants.map((variant, index) => {
    const sizeOrDimension = variant?.sizeOrDimension?.trim() || `Option ${index + 1}`;
    const color = variant?.color?.trim() || null;
    const additionalPrice = toNumber(variant?.additionalPrice);
    const stockCount = Math.max(0, toNumber(variant?.stockCount));

    return {
      sku: variant?.sku?.trim() || `${product._id ?? product.id ?? "product"}-variant-${index + 1}`,
      sizeOrDimension,
      color,
      additionalPrice,
      stockCount,
      label: buildVariantLabel({ sizeOrDimension, color }),
      price: basePrice + additionalPrice,
    };
  });
}

export function getPreferredVariant(product: BuyerProduct) {
  return product.variants.find((variant) => variant.stockCount > 0) ?? product.variants[0] ?? null;
}

export function formatCategoryLabel(category: string | null | undefined) {
  if (!category) {
    return "Collection";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function normalizeProduct(product: ProductLike): BuyerProduct {
  const images = normalizeImages(product.images, product.imageUrl);
  const basePrice = toNumber(product.basePrice ?? product.price);
  const variants = normalizeVariants(product, basePrice);

  return {
    _id: product._id ?? product.id ?? "",
    title: product.title ?? product.name ?? "Untitled Product",
    description: product.description ?? "A premium Aurenza piece.",
    basePrice,
    category: product.category ?? "collection",
    stock: variants.length > 0 ? variants.reduce((total, variant) => total + variant.stockCount, 0) : normalizeStock(product),
    imageUrl: images[0] ?? null,
    images,
    variants,
  };
}

export function normalizeProductListResponse(payload: unknown) {
  const record = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
  const source = Array.isArray(record.products)
    ? record.products
    : Array.isArray(record.data)
      ? record.data
      : [];

  return source.map((product) => normalizeProduct(product as ProductLike));
}

export function normalizeProductResponse(payload: unknown) {
  const record = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
  const source = (record.product ?? record.data) as ProductLike | undefined;

  if (!source) {
    return null;
  }

  return normalizeProduct(source);
}
