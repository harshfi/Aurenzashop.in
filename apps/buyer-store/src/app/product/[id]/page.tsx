"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { buildApiUrl } from "@/lib/api";
import {
  formatCategoryLabel,
  getPreferredVariant,
  normalizeProductResponse,
  type BuyerProduct,
  type BuyerProductVariant,
} from "@/lib/products";

function ProductImage({ product, index }: { product: BuyerProduct; index: number }) {
  const imageUrl = product.images[index] ?? product.imageUrl;

  if (!imageUrl) {
    return <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f6e7c8,#ead9b7_52%,#d2c0a1)]" />;
  }

  return (
    <Image
      src={imageUrl}
      alt={product.title}
      fill
      priority
      sizes="(max-width: 1024px) 100vw, 50vw"
      className="object-cover object-center"
    />
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<BuyerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantSku, setSelectedVariantSku] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      if (!productId) {
        setLoading(false);
        setProduct(null);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage(null);

        const response = await fetch(buildApiUrl(`/api/products/${productId}`), {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const normalizedProduct = normalizeProductResponse(payload);

        setProduct(normalizedProduct);
        setSelectedVariantSku(normalizedProduct ? getPreferredVariant(normalizedProduct)?.sku ?? null : null);
        setQuantity(1);
        setSelectedImageIndex(0);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to fetch product:", error);
        setProduct(null);
        setErrorMessage("We couldn't load this product right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => controller.abort();
  }, [productId]);

  useEffect(() => {
    if (!addedToCart) {
      return;
    }

    const timeoutId = window.setTimeout(() => setAddedToCart(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [addedToCart]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[linear-gradient(180deg,#fffcf7_0%,#ffffff_100%)]">
        <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-600 shadow-sm">
          <div className="h-5 w-5 rounded-full border-2 border-amber-200 border-t-amber-700 animate-spin" />
          Loading product
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-stone-900">Product not found</h2>
        <p className="mt-3 text-sm text-stone-500">
          {errorMessage ?? "The piece you are looking for may have moved or is no longer available."}
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          Return to shop
        </Link>
      </div>
    );
  }

  const selectedVariant: BuyerProductVariant | null =
    product.variants.find((variant) => variant.sku === selectedVariantSku) ?? getPreferredVariant(product);
  const availableStock = selectedVariant?.stockCount ?? product.stock;
  const selectedPrice = selectedVariant?.price ?? product.basePrice;
  const safeImageIndex = product.images[selectedImageIndex] ? selectedImageIndex : 0;
  const maxQuantity = Math.max(1, availableStock);
  const safeQuantity = availableStock > 0 ? Math.min(quantity, maxQuantity) : 1;

  return (
    <div className="bg-[linear-gradient(180deg,#fffcf7_0%,#ffffff_44%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-14">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white shadow-[0_24px_60px_rgba(28,25,23,0.08)]">
              <ProductImage product={product} index={safeImageIndex} />
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-2xl border transition-all ${
                      safeImageIndex === index
                        ? "border-amber-500 shadow-lg shadow-amber-100"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                    aria-label={`Show image ${index + 1}`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${product.title} view ${index + 1}`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="rounded-[2rem] border border-stone-200/80 bg-white p-7 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-800">
                  {formatCategoryLabel(product.category)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${
                    availableStock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {availableStock > 0 ? `${availableStock} in stock` : "Sold out"}
                </span>
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.05em] text-stone-900 sm:text-5xl">
                {product.title}
              </h1>
              <p className="mt-4 text-3xl font-semibold text-amber-800">
                ₹{selectedPrice.toLocaleString()}
              </p>
              <p className="mt-6 max-w-2xl text-base leading-7 text-stone-600">
                {product.description}
              </p>

              {product.variants.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Select option</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {product.variants.map((variant) => {
                      const isSelected = selectedVariant?.sku === variant.sku;

                      return (
                        <button
                          key={variant.sku}
                          type="button"
                          onClick={() => {
                            setSelectedVariantSku(variant.sku);
                            setQuantity(1);
                          }}
                          className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                            isSelected
                              ? "border-amber-500 bg-amber-50 text-stone-900 shadow-sm"
                              : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                          }`}
                        >
                          <p className="text-sm font-semibold">{variant.label}</p>
                          <p className="mt-1 text-xs">
                            ₹{variant.price.toLocaleString()} · {variant.stockCount > 0 ? `${variant.stockCount} left` : "Out of stock"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 grid gap-4 rounded-[1.75rem] bg-stone-50 p-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Material feel</p>
                  <p className="mt-2 text-sm font-medium text-stone-900">Premium finish</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Dispatch</p>
                  <p className="mt-2 text-sm font-medium text-stone-900">Fast fulfilment</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Styling</p>
                  <p className="mt-2 text-sm font-medium text-stone-900">Curated by Aurenza</p>
                </div>
              </div>

              <div className="mt-8 border-t border-stone-200 pt-8">
                <div className="mb-6 flex flex-wrap items-center gap-4">
                  <div className="flex items-center rounded-full border border-stone-200 bg-white px-2 py-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-semibold text-stone-900">{safeQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((currentQuantity) => Math.min(maxQuantity, currentQuantity + 1))}
                      disabled={safeQuantity >= maxQuantity || availableStock <= 0}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-stone-500">
                    {availableStock > 0 ? "Adjust quantity before adding to cart." : "This option is currently unavailable."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!selectedVariant) {
                      return;
                    }

                    addItem({
                      id: `${product._id}:${selectedVariant.sku}`,
                      productId: product._id,
                      variantSku: selectedVariant.sku,
                      variantLabel: selectedVariant.label,
                      name: product.title,
                      price: selectedVariant.price,
                      quantity: safeQuantity,
                      image: product.imageUrl,
                    });
                    setAddedToCart(true);
                  }}
                  disabled={availableStock <= 0 || !selectedVariant}
                  className={`flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold text-white shadow-lg transition-all ${
                    addedToCart ? "bg-emerald-600" : "bg-stone-900 hover:bg-amber-700"
                  } disabled:cursor-not-allowed disabled:bg-stone-300`}
                >
                  {addedToCart ? (
                    <>
                      <Check className="h-5 w-5" />
                      Added to cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      Add to cart
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-5 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-amber-700" />
                <h3 className="mt-4 text-lg font-semibold text-stone-900">Secure checkout</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Orders are handled through a protected checkout flow with clear confirmation and support.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-5 shadow-sm">
                <Truck className="h-5 w-5 text-amber-700" />
                <h3 className="mt-4 text-lg font-semibold text-stone-900">Fast delivery</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  We keep fulfillment moving quickly so your pieces reach you without the usual waiting game.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
