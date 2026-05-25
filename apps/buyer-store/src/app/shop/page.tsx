"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Filter, ShoppingBag, Home, Star, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Backend Product shape
interface Variant {
  sku: string;
  sizeOrDimension: string;
  color?: string;
  additionalPrice: number;
  stockCount: number;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  basePrice: number;
  category: string;
  images: string[];
  variants: Variant[];
  ratings: { average: number; count: number };
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    _id: "aurenza-cotton-shirt",
    title: "Aurenza Cotton Shirt",
    description: "A crisp everyday shirt made for polished comfort.",
    basePrice: 1299,
    category: "clothing",
    images: ["/placeholder.svg"],
    variants: [
      { sku: "CLO-M-001", sizeOrDimension: "M", color: "White", additionalPrice: 0, stockCount: 12 },
      { sku: "CLO-L-001", sizeOrDimension: "L", color: "White", additionalPrice: 0, stockCount: 8 },
    ],
    ratings: { average: 4.6, count: 18 },
  },
  {
    _id: "aurenza-botanical-wallpaper",
    title: "Botanical Wallpaper",
    description: "Elegant botanical wallpaper for calm, premium interiors.",
    basePrice: 2199,
    category: "wallpaper",
    images: ["/placeholder.svg"],
    variants: [
      { sku: "WAL-8X10-001", sizeOrDimension: "8x10 ft", color: "Sage", additionalPrice: 0, stockCount: 10 },
    ],
    ratings: { average: 4.8, count: 11 },
  },
];

function getTotalStock(variants: Variant[]) {
  if (!variants || variants.length === 0) return 0;
  return variants.reduce((sum, v) => sum + v.stockCount, 0);
}

function getFallbackProducts(category?: string | null) {
  return FALLBACK_PRODUCTS.filter((product) => !category || product.category === category.toLowerCase());
}

function filterBySearch(products: Product[], search: string | null) {
  if (!search) return products;
  const q = search.toLowerCase();
  return products.filter((product) =>
    product.title.toLowerCase().includes(q) ||
    product.description.toLowerCase().includes(q) ||
    product.category.toLowerCase().includes(q)
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category")?.toLowerCase() || null;
  const searchQuery = searchParams.get("search")?.trim() || null;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const url = new URL(`${API_BASE}/products`);
        if (categoryParam) {
          url.searchParams.append("category", categoryParam);
        }
        if (searchQuery) {
          url.searchParams.append("search", searchQuery);
        }
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
          const apiProducts = data.products || [];
          const fallback = getFallbackProducts(categoryParam);
          const baseProducts = apiProducts.length > 0 ? apiProducts : fallback;
          setProducts(filterBySearch(baseProducts, searchQuery));
        } else {
          setProducts(filterBySearch(getFallbackProducts(categoryParam), searchQuery));
          setError("Showing sample products while the backend is unavailable.");
        }
      } catch {
        setProducts(filterBySearch(getFallbackProducts(categoryParam), searchQuery));
        setError("Showing sample products while the backend is unavailable.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryParam, searchQuery]);

  const CATEGORIES = [
    { label: "All Products", value: null },
    { label: "Clothing", value: "clothing", icon: ShoppingBag },
    { label: "Home Decor", value: "wallpaper", icon: Home },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-56 flex-shrink-0">
          <div className="sticky top-24">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 border-b pb-2">
              <Filter className="w-4 h-4" /> Categories
            </h3>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.map(({ label, value, icon: Icon }) => {
                const isActive = categoryParam === value || (!categoryParam && value === null);
                return (
                  <li key={label}>
                    <Link
                      href={value ? `/shop?category=${value}` : "/shop"}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors font-medium ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 capitalize">
              {searchQuery
                ? `Search: ${searchQuery}`
                : categoryParam
                ? (categoryParam === "wallpaper" ? "Home Decor" : "Clothing")
                : "All Products"}
            </h1>
            <span className="text-sm text-gray-500">{products.length} item{products.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">Premium Quality</span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">Fast Delivery</span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">Secure Checkout</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center mb-6">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl aspect-[3/4]" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const stock = getTotalStock(product.variants);
                const imageUrl = product.images?.[0] || "/placeholder.svg";
                const firstVariant = product.variants?.[0];
                const displayPrice = product.basePrice + (firstVariant?.additionalPrice || 0);
                const cartItem = items.find((item) => item.id === product._id);
                const cartQty = cartItem?.quantity || 0;

                return (
                  <div
                    key={product._id}
                    className="group relative flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <Link href={`/product/${product._id}`} className="block relative aspect-[4/5] bg-gray-50 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                      />
                      {stock <= 0 && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                          Out of stock
                        </div>
                      )}
                      {product.ratings?.count > 0 && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-full text-gray-800">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {product.ratings.average}
                        </div>
                      )}
                    </Link>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 capitalize">{product.category}</p>
                        </div>
                        <p className="font-bold text-indigo-600 whitespace-nowrap ml-3">₹{displayPrice.toLocaleString("en-IN")}</p>
                      </div>
                      {stock > 0 && cartQty > 0 ? (
                        <div className="mt-auto flex h-11 items-center justify-between rounded-full border border-gray-200 bg-gray-50 px-2">
                          <button
                            onClick={() => (cartQty <= 1 ? removeItem(product._id) : updateQuantity(product._id, cartQty - 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-white hover:text-indigo-600"
                            aria-label={`Decrease ${product.title} quantity`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-gray-900">{cartQty}</span>
                          <button
                            onClick={() => updateQuantity(product._id, Math.min(stock, cartQty + 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-white hover:text-indigo-600"
                            aria-label={`Increase ${product.title} quantity`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                          addItem({
                            id: product._id,
                            name: product.title,
                            price: displayPrice,
                            quantity: 1,
                            image: imageUrl,
                            variantSku: firstVariant?.sku,
                          })
                        }
                          disabled={stock <= 0}
                          className="mt-auto w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-gray-500">We couldn&apos;t find any products in this category.</p>
                <Link href="/shop" className="mt-6 inline-block text-indigo-600 font-medium hover:underline">
                  View all products
                </Link>
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
        <div className="container mx-auto px-4 py-12 flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
