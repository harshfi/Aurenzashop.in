"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface Product {
  _id: string;
  title: string;
  description: string;
  basePrice: number;
  category: string;
  images: string[];
  variants: Array<{
    sku: string;
    sizeOrDimension: string;
    color?: string;
    additionalPrice: number;
    stockCount: number;
  }>;
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
  },
];

function normalizeProduct(data: any): Product | null {
  const product = data?.product || data?.data || data;
  if (!product) return null;

  if (product.title && typeof product.basePrice === "number") {
    return product;
  }

  if (product.name && typeof product.price === "number") {
    return {
      _id: product._id,
      title: product.name,
      description: product.description || "",
      basePrice: product.price,
      category: product.category || "clothing",
      images: [product.imageUrl || "/placeholder.svg"],
      variants: [
        {
          sku: `${product.category || "item"}-${product._id || "default"}`,
          sizeOrDimension: "Default",
          additionalPrice: 0,
          stockCount: product.stock || 0,
        },
      ],
    };
  }

  return null;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setProduct(normalizeProduct(data));
        }
      } catch {
        setProduct(FALLBACK_PRODUCTS.find((item) => item._id === id) || null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link href="/shop" className="mt-4 inline-block text-indigo-600 font-medium hover:underline">Return to Shop</Link>
      </div>
    );
  }

  const totalStock = product.variants?.reduce((sum, variant) => sum + variant.stockCount, 0) || 0;

  const handleAddToCart = () => {
    const firstVariant = product.variants?.[0];
    const price = product.basePrice + (firstVariant?.additionalPrice || 0);

    addItem({
      id: product._id,
      name: product.title,
      price,
      quantity,
      image: product.images?.[0] || "/placeholder.svg",
      variantSku: firstVariant?.sku,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </Link>
      
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Product Image */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gray-100 border border-gray-100 sticky top-24">
          <Image
            src={product.images?.[0] || "/placeholder.svg"}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-full w-full object-cover object-center"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
              {product.category}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-4">{product.title}</h1>
            <p className="text-3xl font-semibold text-gray-900 mb-6">₹{product.basePrice.toLocaleString("en-IN")}</p>
          </div>

          <div className="prose prose-sm sm:prose-base text-gray-600 mb-8">
            <p>{product.description}</p>
          </div>

          <div className="mt-auto border-t pt-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-200 rounded-full bg-white h-12 px-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(totalStock, quantity + 1))}
                  disabled={quantity >= totalStock}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {totalStock > 0 ? `${totalStock} items available` : "Out of stock"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={totalStock <= 0}
                className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-full text-base font-semibold text-white shadow-lg transition-all ${
                  addedToCart 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {addedToCart ? (
                  <><Check className="w-5 h-5" /> Added to Cart</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" /> Add to Cart</>
                )}
              </button>
            </div>
            
            <div className="mt-10 grid grid-cols-2 gap-4 py-6 border-y">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Secure Checkout
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="w-5 h-5 text-indigo-600" />
                Fast Delivery
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
