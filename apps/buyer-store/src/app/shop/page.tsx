"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, startTransition, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Filter, Paintbrush, ShoppingBag, Sparkles } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { buildApiUrl } from "@/lib/api";
import {
  formatCategoryLabel,
  getPreferredVariant,
  normalizeProductListResponse,
  PRODUCT_CATEGORIES,
  type BuyerProduct,
} from "@/lib/products";

function ProductImage({ product }: { product: BuyerProduct }) {
  if (!product.imageUrl) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f6e7c8,#ead9b7_52%,#d2c0a1)]" />
    );
  }

  return (
    <Image
      src={product.imageUrl}
      alt={product.title}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
    />
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [products, setProducts] = useState<BuyerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const activeCategory = useMemo(
    () =>
      PRODUCT_CATEGORIES.find((category) => category.value === categoryParam) ??
      PRODUCT_CATEGORIES[0],
    [categoryParam]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const url = new URL(buildApiUrl("/api/products"));
        if (categoryParam) {
          url.searchParams.set("category", categoryParam);
        }

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const normalizedProducts = normalizeProductListResponse(payload);

        startTransition(() => {
          setProducts(normalizedProducts);
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to fetch products:", error);
        setProducts([]);
        setErrorMessage("We couldn't load the collection right now. Please try again in a moment.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, [categoryParam]);

  const productCountLabel = `${products.length} ${products.length === 1 ? "piece" : "pieces"}`;

  return (
    <div className="bg-[linear-gradient(180deg,#fffcf7_0%,#fff8ee_22%,#ffffff_52%)]">
      <section className="border-b border-stone-200/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Curated collection
            </div>
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.32em] text-stone-500">Aurenza shop</p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-stone-900 sm:text-5xl">
                {activeCategory.label === "All products"
                  ? "Designed pieces for dressing beautifully and living deliberately."
                  : `${activeCategory.label} selected for a sharper, more considered home and wardrobe.`}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
                {activeCategory.blurb}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {PRODUCT_CATEGORIES.map((category) => {
                const isActive = activeCategory.value === category.value;

                return (
                  <Link
                    key={category.value}
                    href={category.href}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-stone-900 text-white shadow-lg shadow-stone-200"
                        : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-amber-700"
                    }`}
                  >
                    {category.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(145deg,#2f241f,#6c4f3d_45%,#d6a86a_120%)] p-8 text-white shadow-[0_25px_80px_rgba(120,74,27,0.18)]">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">Now browsing</p>
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                  {categoryParam ? formatCategoryLabel(categoryParam) : "All products"}
                </h2>
                <p className="max-w-sm text-sm leading-6 text-white/75">
                  Elevated essentials, rich materials, and styling details that hold up in real life.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/65">Available</p>
                  <p className="mt-2 text-3xl font-semibold">{productCountLabel}</p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/65">Fast add</p>
                  <p className="mt-2 text-3xl font-semibold">1 tap</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-14">
        <aside className="h-fit rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-stone-200 pb-4 text-stone-900">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">Browse by category</h3>
          </div>
          <div className="space-y-3">
            {PRODUCT_CATEGORIES.map((category) => {
              const isActive = activeCategory.value === category.value;
              const Icon = category.value === "wallpaper" ? Paintbrush : ShoppingBag;

              return (
                <Link
                  key={category.value}
                  href={category.href}
                  className={`flex items-start justify-between rounded-2xl px-4 py-4 transition-all ${
                    isActive ? "bg-amber-50 text-stone-900 ring-1 ring-amber-200" : "hover:bg-stone-50"
                  }`}
                >
                  <div>
                    <p className="font-medium">{category.label}</p>
                    <p className="mt-1 text-sm text-stone-500">{category.blurb}</p>
                  </div>
                  <Icon className={`mt-1 h-4 w-4 ${isActive ? "text-amber-700" : "text-stone-400"}`} />
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-stone-200/80 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-stone-500">Collection</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-stone-900">
                {activeCategory.label}
              </h2>
            </div>
            <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-600">
              {loading ? "Loading pieces..." : productCountLabel}
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
              <p className="text-lg font-semibold">Collection unavailable</p>
              <p className="mt-2 text-sm">{errorMessage}</p>
            </div>
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[2rem] border border-stone-200/70 bg-white shadow-sm"
                >
                  <div className="aspect-[4/5] animate-pulse bg-stone-100" />
                  <div className="space-y-4 p-5">
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-stone-100" />
                    <div className="h-4 w-1/3 animate-pulse rounded-full bg-stone-100" />
                    <div className="h-11 animate-pulse rounded-full bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                (() => {
                  const preferredVariant = getPreferredVariant(product);

                  return (
                    <article
                      key={product._id}
                      className="group overflow-hidden rounded-[2rem] border border-stone-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(28,25,23,0.08)]"
                    >
                      <Link href={`/product/${product._id}`} className="relative block aspect-[4/5] overflow-hidden bg-stone-100">
                        <ProductImage product={product} />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-900/30 to-transparent" />
                        {product.stock <= 0 && (
                          <div className="absolute left-4 top-4 rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white">
                            Sold out
                          </div>
                        )}
                      </Link>
                      <div className="flex h-[220px] flex-col p-5">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                              {formatCategoryLabel(product.category)}
                            </p>
                            <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-stone-900">
                              {product.title}
                            </h3>
                          </div>
                          <p className="whitespace-nowrap text-lg font-semibold text-amber-800">
                            ₹{(preferredVariant?.price ?? product.basePrice).toLocaleString()}
                          </p>
                        </div>
                        <p className="line-clamp-2 text-sm leading-6 text-stone-600">{product.description}</p>
                        <div className="mt-3 text-xs text-stone-500">
                          {preferredVariant ? `Quick add: ${preferredVariant.label}` : "Choose an option on the product page"}
                        </div>
                        <div className="mt-auto flex items-center gap-3 pt-5">
                          <button
                            type="button"
                            onClick={() => {
                              if (!preferredVariant) {
                                return;
                              }

                              addItem({
                                id: `${product._id}:${preferredVariant.sku}`,
                                productId: product._id,
                                variantSku: preferredVariant.sku,
                                variantLabel: preferredVariant.label,
                                name: product.title,
                                price: preferredVariant.price,
                                quantity: 1,
                                image: product.imageUrl,
                              });
                            }}
                            disabled={product.stock <= 0 || !preferredVariant}
                            className="inline-flex flex-1 items-center justify-center rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                          >
                            {product.stock > 0 ? "Quick add" : "Unavailable"}
                          </button>
                          <Link
                            href={`/product/${product._id}`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition-colors hover:border-amber-200 hover:text-amber-700"
                            aria-label={`View ${product.title}`}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })()
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-5 text-xl font-semibold text-stone-900">No products in this collection yet</h3>
              <p className="mt-2 text-sm text-stone-500">
                Try another category or return to the full catalogue.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                Browse all products
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-[linear-gradient(180deg,#fffcf7_0%,#ffffff_100%)]">
          <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-600 shadow-sm">
            <div className="h-5 w-5 rounded-full border-2 border-amber-200 border-t-amber-700 animate-spin" />
            Loading collection
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
