"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Filter, ShoppingBag, Star, Minus, Plus, LayoutGrid, Rows3, Search } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

type Variant = {
  sku: string;
  sizeOrDimension: string;
  color?: string;
  additionalPrice: number;
  stockCount: number;
};

type Product = {
  _id: string;
  title: string;
  shortDescription?: string;
  description: string;
  brand: string;
  basePrice: number;
  compareAtPrice?: number | null;
  discountPercentage?: number;
  category: string;
  subcategory?: string;
  collection?: string;
  material?: string;
  images: string[];
  mainImage?: string;
  hoverImage?: string;
  galleryImages?: string[];
  variants: Variant[];
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  ratings: { average: number; count: number };
};

function getProductImageStack(product: Product) {
  const merged = [
    ...(product.images || []),
    ...(product.galleryImages || []),
    product.mainImage || "",
    product.hoverImage || "",
  ].filter(Boolean);
  return [...new Set(merged)];
}

type Facets = {
  categories: string[];
  subcategories: string[];
  collections: string[];
  materials: string[];
  sizes: string[];
  colors: string[];
  price: { min: number; max: number };
};

type Suggestion = {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  collection?: string;
};

function getTotalStock(variants: Variant[]) {
  if (!variants || variants.length === 0) return 0;
  return variants.reduce((sum, v) => sum + v.stockCount, 0);
}

function categoryLabel(category: string) {
  const map: Record<string, string> = {
    sarees: "Sarees",
    lehengas: "Lehengas",
    "kurtas-kurta-sets": "Kurtas & Kurta Sets",
    gowns: "Gowns",
    "fusion-wear": "Fusion Wear",
    "dupattas-accessories": "Dupattas & Accessories",
    "seasonal-special": "Seasonal / Special",
    "ethnic-wear": "Ethnic Wear",
    "festive-collection": "Festive Collection",
    accessories: "Accessories",
    "mens-ethnic": "Men's Ethnic",
  };
  return map[category] || category;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get("category") || "";
  const subcategoryParam = searchParams.get("subcategory") || "";
  const collectionParam = searchParams.get("collection") || "";
  const materialParam = searchParams.get("material") || "";
  const searchQuery = searchParams.get("search")?.trim() || "";
  const sortParam = searchParams.get("sort") || "featured";
  const sizeParam = searchParams.get("size") || "";
  const colorParam = searchParams.get("color") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const stockParam = searchParams.get("inStock") || "";
  const newArrivalParam = searchParams.get("newArrival") || "";
  const bestsellerParam = searchParams.get("bestseller") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  const updateQuery = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    router.push(`/shop?${next.toString()}`);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const url = new URL(`${API_BASE}/products`);
        const params = {
          category: categoryParam,
          subcategory: subcategoryParam,
          collection: collectionParam,
          material: materialParam,
          search: searchQuery,
          sort: sortParam,
          size: sizeParam,
          color: colorParam,
          minPrice: minPriceParam,
          maxPrice: maxPriceParam,
          inStock: stockParam,
          newArrival: newArrivalParam,
          bestseller: bestsellerParam,
          limit: "60",
        };

        Object.entries(params).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, value);
        });

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!data.success) throw new Error("Failed to fetch products");

        setProducts(data.products || []);
      } catch {
        setProducts([]);
        setError("Unable to load products right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryParam, subcategoryParam, collectionParam, materialParam, searchQuery, sortParam, sizeParam, colorParam, minPriceParam, maxPriceParam, stockParam, newArrivalParam, bestsellerParam]);

  useEffect(() => {
    const fetchFacets = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/facets`, { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.success) setFacets(data.facets);
      } catch {
        setFacets(null);
      }
    };

    fetchFacets();
  }, []);

  useEffect(() => {
    const query = searchInput.trim();
    if (query.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/products/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setSuggestions(data.suggestions || []);
        }
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalItemsText = `${products.length} item${products.length !== 1 ? "s" : ""}`;

  const activeFilters = useMemo(() => {
    return [categoryParam, subcategoryParam, collectionParam, materialParam, sizeParam, colorParam, minPriceParam, maxPriceParam, stockParam, newArrivalParam, bestsellerParam].filter(Boolean).length;
  }, [categoryParam, subcategoryParam, collectionParam, materialParam, sizeParam, colorParam, minPriceParam, maxPriceParam, stockParam, newArrivalParam, bestsellerParam]);

  return (
    <div className="container mx-auto px-4 py-10 sm:py-12">
      <div className="mb-6 rounded-3xl border border-[#2a1d120f] bg-gradient-to-r from-[#fefaf3] via-[#f7efe3] to-[#fefaf3] p-5 sm:p-7 section-shell">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a5a2d]">Aurenza Boutique</p>
            <h1 className="mt-2 font-display text-4xl text-[#16110d] sm:text-5xl">
              {searchQuery ? `Search: ${searchQuery}` : collectionParam ? collectionParam : categoryParam ? categoryLabel(categoryParam) : "All Collections"}
            </h1>
            <p className="mt-1 text-sm text-[#6d5a47]">{totalItemsText}</p>
          </div>

          <div className="relative w-full lg:max-w-md">
            <div className="flex h-11 items-center rounded-full border border-[#2d20110f] bg-white px-3">
              <Search className="h-4 w-4 text-[#8a7d70]" />
              <input
                value={searchInput}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSearchInput(nextValue);
                  if (nextValue.trim().length < 2) {
                    setSuggestions([]);
                  }
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search collections, styles..."
                className="w-full border-0 bg-transparent px-2 text-sm text-slate-800 outline-none"
              />
              <button
                onClick={() => updateQuery({ search: searchInput.trim() || null })}
                className="rounded-full bg-[#19130d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2b2017]"
              >
                Search
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#2d20110f] bg-white shadow-xl">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      setSearchInput(suggestion.title);
                      setShowSuggestions(false);
                      updateQuery({ search: suggestion.title });
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#f7efe3]"
                  >
                    <span className="text-slate-800">{suggestion.title}</span>
                    <span className="text-xs text-slate-500">{suggestion.collection || categoryLabel(suggestion.category)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-80">
          <div className="sticky top-24 space-y-5 rounded-2xl border border-[#2a1d120f] bg-white p-5 shadow-sm section-shell">
            <div className="flex items-center justify-between border-b border-[#2a1d120f] pb-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#2b1f16]"><Filter className="h-4 w-4" /> Filters</h3>
              {activeFilters > 0 && (
                <button
                  onClick={() => updateQuery({ category: null, subcategory: null, collection: null, material: null, size: null, color: null, minPrice: null, maxPrice: null, inStock: null, newArrival: null, bestseller: null })}
                  className="text-xs font-semibold text-[#8a5a2d] hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Collection</label>
              <select value={collectionParam} onChange={(e) => updateQuery({ collection: e.target.value || null })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">All Collections</option>
                {(facets?.collections || []).map((collection) => (
                  <option key={collection} value={collection}>{collection}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
              <select value={categoryParam} onChange={(e) => updateQuery({ category: e.target.value || null })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">All Categories</option>
                {(facets?.categories || []).map((category) => (
                  <option key={category} value={category}>{categoryLabel(category)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Subcategory</label>
              <select value={subcategoryParam} onChange={(e) => updateQuery({ subcategory: e.target.value || null })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">Any</option>
                {(facets?.subcategories || []).map((subcategory) => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Material</label>
              <select value={materialParam} onChange={(e) => updateQuery({ material: e.target.value || null })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">Any</option>
                {(facets?.materials || []).map((material) => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Min ₹</label>
                <input type="number" value={minPriceParam} onChange={(e) => updateQuery({ minPrice: e.target.value || null })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Max ₹</label>
                <input type="number" value={maxPriceParam} onChange={(e) => updateQuery({ maxPrice: e.target.value || null })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Size</label>
                <select value={sizeParam} onChange={(e) => updateQuery({ size: e.target.value || null })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">Any</option>
                  {(facets?.sizes || []).map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Color</label>
                <select value={colorParam} onChange={(e) => updateQuery({ color: e.target.value || null })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">Any</option>
                  {(facets?.colors || []).map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={stockParam === "true"}
                onChange={(e) => updateQuery({ inStock: e.target.checked ? "true" : null })}
                className="h-4 w-4 rounded border-slate-300 text-[#8a5a2d]"
              />
              In stock only
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={newArrivalParam === "true"}
                onChange={(e) => updateQuery({ newArrival: e.target.checked ? "true" : null })}
                className="h-4 w-4 rounded border-slate-300 text-[#8a5a2d]"
              />
              New arrivals only
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={bestsellerParam === "true"}
                onChange={(e) => updateQuery({ bestseller: e.target.checked ? "true" : null })}
                className="h-4 w-4 rounded border-slate-300 text-[#8a5a2d]"
              />
              Bestsellers only
            </label>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#5e4c3a]">
              <span className="rounded-full border border-[#8a5a2d2e] bg-[#f7ede0] px-3 py-1">Premium Fabric</span>
              <span className="rounded-full border border-[#8a5a2d2e] bg-[#f7ede0] px-3 py-1">Trustworthy Delivery</span>
              <span className="rounded-full border border-[#8a5a2d2e] bg-[#f7ede0] px-3 py-1">Secure Checkout</span>
            </div>

            <div className="flex items-center gap-2">
              <select value={sortParam} onChange={(e) => updateQuery({ sort: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="bestseller">Best Sellers</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <button onClick={() => setView("grid")} className={`rounded-lg p-2 ${view === "grid" ? "bg-[#19130d] text-white" : "border border-slate-200 bg-white text-slate-600"}`}><LayoutGrid className="h-4 w-4" /></button>
              <button onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-[#19130d] text-white" : "border border-slate-200 bg-white text-slate-600"}`}><Rows3 className="h-4 w-4" /></button>
            </div>
          </div>

          {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-red-700">{error}</div>}

          {loading ? (
            <div className={`grid gap-6 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-[#efe7dc]" />)}
            </div>
          ) : products.length > 0 ? (
            <div className={`grid gap-6 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
              {products.map((product) => {
                const stock = getTotalStock(product.variants);
                const imageStack = getProductImageStack(product);
                const imageUrl = imageStack[0] || "/placeholder.svg";
                const firstVariant = product.variants?.[0];
                const displayPrice = product.basePrice + (firstVariant?.additionalPrice || 0);
                const compareAt = product.compareAtPrice || null;
                const discountPercent = product.discountPercentage || (compareAt && compareAt > displayPrice ? Math.round(((compareAt - displayPrice) / compareAt) * 100) : 0);
                const lineId = `${product._id}::${firstVariant?.sku || "default"}`;
                const cartItem = items.find((item) => (item.lineId || `${item.id}::${item.variantSku || "default"}`) === lineId);
                const cartQty = cartItem?.quantity || 0;

                return (
                  <div key={product._id} className={`group relative overflow-hidden rounded-2xl border border-[#2a1d120f] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${view === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"}`}>
                    <Link href={`/product/${product._id}`} className={`relative block overflow-hidden bg-[#f7efe3] ${view === "list" ? "sm:w-64" : "aspect-[4/5]"}`}>
                      <div className={view === "list" ? "relative h-64 w-full" : "relative aspect-[4/5] w-full"}>
                        <Image src={imageUrl} alt={product.title} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-center transition-transform duration-500 group-hover:scale-105" />
                      </div>

                      {discountPercent > 0 && <div className="absolute left-3 top-3 rounded-full bg-[#8a5a2d] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">-{discountPercent}%</div>}
                      {product.newArrival && <div className="absolute left-3 top-11 rounded-full bg-[#19130d] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">New</div>}
                      {product.bestseller && <div className="absolute left-3 top-19 rounded-full bg-[#3d2a1a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Bestseller</div>}
                      {stock <= 0 && <div className="absolute right-3 top-3 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Out of Stock</div>}
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8a5a2d]">{product.collection || categoryLabel(product.category)}</p>
                      <h3 className="mt-1 line-clamp-1 font-semibold text-gray-900">{product.title}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">{product.subcategory || categoryLabel(product.category)}</p>

                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{product.ratings?.average || 0}</span>
                        <span>({product.ratings?.count || 0})</span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <p className="text-lg font-bold text-[#8a5a2d]">₹{displayPrice.toLocaleString("en-IN")}</p>
                        {compareAt && compareAt > displayPrice && <p className="text-sm text-slate-400 line-through">₹{compareAt.toLocaleString("en-IN")}</p>}
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.shortDescription || product.description}</p>

                      {stock > 0 && cartQty > 0 ? (
                        <div className="mt-auto flex h-11 items-center justify-between rounded-full border border-gray-200 bg-gray-50 px-2">
                          <button onClick={() => (cartQty <= 1 ? removeItem(lineId) : updateQuantity(lineId, cartQty - 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-white hover:text-[#8a5a2d]" aria-label={`Decrease ${product.title} quantity`}>
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-gray-900">{cartQty}</span>
                          <button onClick={() => updateQuantity(lineId, Math.min(stock, cartQty + 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-white hover:text-[#8a5a2d]" aria-label={`Increase ${product.title} quantity`}>
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem({ id: product._id, name: product.title, price: displayPrice, quantity: 1, image: imageUrl, variantSku: firstVariant?.sku, category: product.category, brand: product.brand })}
                          disabled={stock <= 0}
                          className="mt-auto w-full rounded-full bg-[#19130d] py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#2b2017] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {stock > 0 ? "Add to Cart" : "Out of Stock"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !error && (
              <div className="rounded-3xl border border-dashed bg-[#f7efe3] py-20 text-center">
                <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-[#a8927d]" />
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your search or filters.</p>
                <button onClick={() => updateQuery({ category: null, subcategory: null, collection: null, material: null, size: null, color: null, minPrice: null, maxPrice: null, inStock: null, search: null, newArrival: null, bestseller: null })} className="mt-6 text-[#8a5a2d] font-medium hover:underline">Reset filters</button>
              </div>
            )
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
        <div className="container mx-auto flex h-96 items-center justify-center px-4 py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9c7b2] border-t-[#8a5a2d]" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
