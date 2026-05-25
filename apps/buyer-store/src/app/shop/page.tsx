"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, ShoppingBag, Paintbrush } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const url = new URL("http://localhost:5003/api/products");
        if (categoryParam) {
          url.searchParams.append("category", categoryParam);
        }
        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryParam]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-6 flex-shrink-0">
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 border-b pb-2">
              <Filter className="w-4 h-4" /> Categories
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link href="/shop" className={`hover:text-indigo-600 transition-colors ${!categoryParam ? 'text-indigo-600 font-medium' : ''}`}>
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Clothing" className={`hover:text-indigo-600 transition-colors flex items-center justify-between ${categoryParam === 'Clothing' ? 'text-indigo-600 font-medium' : ''}`}>
                  Clothing <ShoppingBag className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Wallpapers" className={`hover:text-indigo-600 transition-colors flex items-center justify-between ${categoryParam === 'Wallpapers' ? 'text-indigo-600 font-medium' : ''}`}>
                  Wallpapers <Paintbrush className="w-3 h-3 opacity-50" />
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {categoryParam ? categoryParam : "All Products"}
            </h1>
            <span className="text-sm text-gray-500">{products.length} Products</span>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl aspect-[3/4]" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product._id} className="group relative flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                  <Link href={`/product/${product._id}`} className="block relative aspect-[4/5] bg-gray-50 overflow-hidden">
                    <img
                      src={product.imageUrl || "/placeholder.jpg"}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.stock <= 0 && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Out of stock
                      </div>
                    )}
                  </Link>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                      </div>
                      <p className="font-bold text-indigo-600 whitespace-nowrap ml-2">₹{product.price}</p>
                    </div>
                    <button
                      onClick={() => addItem({ id: product._id, name: product.name, price: product.price, quantity: 1, image: product.imageUrl })}
                      disabled={product.stock <= 0}
                      className="mt-auto w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-gray-500">We couldn't find any products in this category.</p>
              <Link href="/shop" className="mt-6 inline-block text-indigo-600 font-medium hover:underline">
                View all products
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
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
