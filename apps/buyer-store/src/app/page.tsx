import Link from "next/link";
import { ArrowRight, ShoppingBag, Paintbrush } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="border-b bg-gray-900 text-white">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-2 text-xs font-medium uppercase tracking-wide">
          <span>Free Shipping Above ₹999</span>
          <span>Premium Fabric & Prints</span>
          <span>Easy Return Support</span>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center overflow-hidden bg-indigo-50/50 pt-20 pb-32">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl mb-8 leading-tight">
              Elevate Your <span className="text-indigo-600">Style</span> & <span className="text-indigo-600">Space</span>
            </h1>
            <p className="mx-auto mb-10 max-w-xl text-lg text-gray-600 leading-relaxed">
              Discover our curated collection of premium clothing and elegant wallpapers. Designed for those who appreciate the finer things in life.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/shop?category=clothing" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all">
                Shop Clothing <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shop?category=wallpaper" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-gray-900 shadow-md ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:scale-105 transition-all">
                Shop Wallpapers <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Featured Categories</h2>
            <p className="mt-4 text-gray-500">Explore our most popular collections</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            <Link href="/shop?category=clothing" className="group relative overflow-hidden rounded-3xl bg-gray-100 aspect-[4/3] flex flex-col justify-end p-8 transition-transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Premium Clothing</h3>
                </div>
                <p className="text-gray-200 font-medium flex items-center gap-2 group-hover:text-white transition-colors">
                  Explore Collection <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </p>
              </div>
            </Link>
            
            <Link href="/shop?category=wallpaper" className="group relative overflow-hidden rounded-3xl bg-gray-100 aspect-[4/3] flex flex-col justify-end p-8 transition-transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
                    <Paintbrush className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Elegant Wallpapers</h3>
                </div>
                <p className="text-gray-200 font-medium flex items-center gap-2 group-hover:text-white transition-colors">
                  Explore Collection <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Style Spotlight</h2>
            <p className="mt-3 text-gray-500">Curated picks for wardrobe and walls</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Link href="/shop?category=clothing" className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">New Arrivals</p>
              <h3 className="mt-2 text-xl font-semibold text-gray-900">Everyday Ethnic Wear</h3>
              <p className="mt-2 text-sm text-gray-600">Fresh silhouettes, breathable fabrics, and timeless motifs.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">Explore Clothing <ArrowRight className="h-4 w-4" /></span>
            </Link>
            <Link href="/shop?category=wallpaper" className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Best Sellers</p>
              <h3 className="mt-2 text-xl font-semibold text-gray-900">Signature Wall Prints</h3>
              <p className="mt-2 text-sm text-gray-600">Statement walls with elegant textures and calming palettes.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">Explore Wallpapers <ArrowRight className="h-4 w-4" /></span>
            </Link>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-600 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">Aurenza Promise</p>
              <h3 className="mt-2 text-xl font-semibold">Premium Quality, Everyday Luxury</h3>
              <p className="mt-3 text-sm text-indigo-100">
                Handpicked products, secure checkout, and attentive post-order support by the Aurenza team.
              </p>
              <Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
                Shop All Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
