"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, ShieldCheck, Truck, Heart, Sparkles, BadgeCheck } from "lucide-react";
import Link from "next/link";

interface Product {
  _id: string;
  title: string;
  shortDescription?: string;
  description: string;
  brand?: string;
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
  ratings?: { average: number; count: number };
  variants: Array<{
    sku: string;
    sizeOrDimension: string;
    color?: string;
    additionalPrice: number;
    stockCount: number;
  }>;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem } = useCartStore();

  const getImageStack = (item: Product | null) => {
    if (!item) return ["/placeholder.svg"];
    const merged = [
      ...(item.images || []),
      ...(item.galleryImages || []),
      item.mainImage || "",
      item.hoverImage || "",
    ].filter(Boolean);
    return [...new Set(merged)];
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/proxy-products/${encodeURIComponent(String(id))}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product || null);
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.category) return;
      try {
        const params = new URLSearchParams({
          category: product.category,
          limit: "8",
          sort: "popular",
        });
        const res = await fetch(`/api/proxy-products?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setRelated((data.products || []).filter((item: Product) => item._id !== product._id).slice(0, 4));
        }
      } catch {
        setRelated([]);
      }
    };

    fetchRelated();
  }, [product?.category, product?._id]);

  useEffect(() => {
    if (!product?._id) return;
    const key = "aurenza_recently_viewed";
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    const next = [product._id, ...parsed.filter((pid: string) => pid !== product._id)].slice(0, 12);
    localStorage.setItem(key, JSON.stringify(next));
  }, [product?._id]);

  useEffect(() => {
    if (!product?._id) return;
    const key = "aurenza_wishlist";
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    const isSaved = parsed.includes(product._id);
    Promise.resolve().then(() => setWishlisted(isSaved));
  }, [product?._id]);

  const toggleWishlist = () => {
    if (!product?._id) return;
    const key = "aurenza_wishlist";
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];

    let next = parsed;
    if (parsed.includes(product._id)) {
      next = parsed.filter((pid: string) => pid !== product._id);
      setWishlisted(false);
    } else {
      next = [product._id, ...parsed];
      setWishlisted(true);
    }

    localStorage.setItem(key, JSON.stringify(next));
  };

  const activeVariant = useMemo(() => product?.variants?.[selectedVariant], [product?.variants, selectedVariant]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-[#d9c7b2] border-t-[#8a5a2d] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link href="/shop" className="mt-4 inline-block text-[#8a5a2d] font-medium hover:underline">Return to Shop</Link>
      </div>
    );
  }

  const imageStack = getImageStack(product);
  const displayPrice = product.basePrice + (activeVariant?.additionalPrice || 0);
  const compareAt = product.compareAtPrice || null;
  const discount = product.discountPercentage || (compareAt && compareAt > displayPrice ? Math.round(((compareAt - displayPrice) / compareAt) * 100) : 0);

  const handleAddToCart = () => {
    if (!activeVariant) return;

    addItem({
      id: product._id,
      name: product.title,
      price: displayPrice,
      quantity,
      image: imageStack[selectedImage] || imageStack[0] || "/placeholder.svg",
      variantSku: activeVariant.sku,
      category: product.category,
      brand: product.brand || "Aurenza",
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-14">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-[#6a5847] hover:text-[#241a12] mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#f3e8da] border border-[#291d120f]">
            <Image
              src={imageStack[selectedImage] || imageStack[0] || "/placeholder.svg"}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-full w-full object-cover object-center"
            />
            {discount > 0 && <span className="absolute left-4 top-4 rounded-full bg-[#8a5a2d] px-3 py-1 text-xs font-bold text-white">-{discount}%</span>}
          </div>
          <div className="grid grid-cols-5 gap-3">
            {imageStack.slice(0, 5).map((img, idx) => (
              <button key={`${img}-${idx}`} onClick={() => setSelectedImage(idx)} className={`relative aspect-square overflow-hidden rounded-xl border ${selectedImage === idx ? "border-[#8a5a2d]" : "border-gray-200"}`}>
                <Image src={img} alt={`${product.title} ${idx + 1}`} fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-2">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block px-3 py-1 bg-[#f0e5d6] text-[#8a5a2d] text-xs font-semibold rounded-full uppercase tracking-wider">{product.collection || product.category}</span>
              {product.material && <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">{product.material}</span>}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-[#1b140f] mb-3">{product.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-3xl font-semibold text-[#1b140f]">₹{displayPrice.toLocaleString("en-IN")}</p>
              {compareAt && compareAt > displayPrice && <p className="text-lg text-gray-400 line-through">₹{compareAt.toLocaleString("en-IN")}</p>}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="h-4 w-4 text-[#8a5a2d]" />
              <span>{product.ratings?.average || 0} rating ({product.ratings?.count || 0} reviews)</span>
            </div>
          </div>

          <div className="prose prose-sm sm:prose-base text-gray-700 mb-8">
            <p>{product.shortDescription || product.description}</p>
          </div>

          <div className="space-y-5 rounded-2xl border border-[#2a1d120f] bg-[#fcf8f2] p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Select Variant</p>
              <div className="flex flex-wrap gap-2">
                {(product.variants || []).map((variant, idx) => (
                  <button
                    key={variant.sku}
                    onClick={() => setSelectedVariant(idx)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${selectedVariant === idx ? "border-[#8a5a2d] bg-[#8a5a2d] text-white" : "border-slate-200 bg-white text-slate-700 hover:border-[#8a5a2d66]"}`}
                  >
                    {variant.sizeOrDimension}{variant.color ? ` • ${variant.color}` : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${activeVariant && activeVariant.stockCount > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
              <span className="text-slate-600">{activeVariant?.stockCount ? `${activeVariant.stockCount} in stock` : "Out of stock"}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-full bg-white h-12 px-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#8a5a2d] hover:bg-[#f7efe3] rounded-full transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(activeVariant?.stockCount || 1, quantity + 1))} disabled={quantity >= (activeVariant?.stockCount || 1)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#8a5a2d] hover:bg-[#f7efe3] rounded-full disabled:opacity-50 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button onClick={toggleWishlist} className={`h-12 rounded-full border px-5 text-sm font-semibold transition ${wishlisted ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-600 hover:border-[#8a5a2d66]"}`}>
                <Heart className={`inline mr-1 h-4 w-4 ${wishlisted ? "fill-rose-500" : ""}`} />
                Wishlist
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAddToCart}
              disabled={(activeVariant?.stockCount || 0) <= 0}
              className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-full text-base font-semibold text-white shadow-lg transition-all ${addedToCart ? "bg-green-600 hover:bg-green-700" : "bg-[#19130d] hover:bg-[#2b2017] hover:scale-[1.01]"} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {addedToCart ? <><Check className="w-5 h-5" /> Added to Cart</> : <><ShoppingBag className="w-5 h-5" /> Add to Cart</>}
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 py-6 border-y border-[#2a1d120f]">
            <div className="flex items-center gap-3 text-sm text-gray-700"><ShieldCheck className="w-5 h-5 text-[#8a5a2d]" /> Secure Checkout</div>
            <div className="flex items-center gap-3 text-sm text-gray-700"><Truck className="w-5 h-5 text-[#8a5a2d]" /> Fast Delivery</div>
            <div className="flex items-center gap-3 text-sm text-gray-700"><BadgeCheck className="w-5 h-5 text-[#8a5a2d]" /> Premium Quality</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl text-[#1b140f] mb-6">You may also like</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link key={item._id} href={`/product/${item._id}`} className="rounded-2xl border border-[#2a1d120f] bg-white p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f3e8da]">
                  <Image src={item.images?.[0] || "/placeholder.svg"} alt={item.title} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-[#8a5a2d]">{item.collection || item.category}</p>
                <h3 className="line-clamp-1 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm font-bold text-[#8a5a2d]">₹{item.basePrice.toLocaleString("en-IN")}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
