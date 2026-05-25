"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import CartDrawer from "@/components/CartDrawer";

export default function Navbar() {
  const router = useRouter();
  const totalItems = useCartStore((state) => state.totalItems);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const search = query.trim();
    if (!search) return router.push("/shop");
    router.push(`/shop?search=${encodeURIComponent(search)}`);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-5">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-indigo-950">
              Aurenza
            </Link>
            <div className="hidden lg:flex gap-5 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
              <Link href="/shop" className="hover:text-indigo-600 transition-colors">Shop</Link>
              <Link href="/shop?category=clothing" className="hover:text-indigo-600 transition-colors">Clothing</Link>
              <Link href="/about" className="hover:text-indigo-600 transition-colors">About</Link>
              <Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
            </div>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search kurtas, sarees, co-ords..."
                className="h-10 w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 text-sm outline-none transition-colors focus:border-indigo-400"
              />
            </div>
            <button
              type="submit"
              className="h-10 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Link href="/profile" className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
              <User className="h-5 w-5" />
            </Link>
            <button
              id="cart-toggle-btn"
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors group"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white group-hover:scale-110 transition-transform">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 flex flex-col gap-4 text-sm font-medium text-gray-600">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="h-10 w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 text-sm outline-none transition-colors focus:border-indigo-400"
                />
              </div>
              <button type="submit" className="h-10 rounded-full bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700">
                Search
              </button>
            </form>
            <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-indigo-600 transition-colors">Home</Link>
            <Link href="/shop" onClick={() => setMobileOpen(false)} className="hover:text-indigo-600 transition-colors">Shop</Link>
            <Link href="/shop?category=clothing" onClick={() => setMobileOpen(false)} className="hover:text-indigo-600 transition-colors">Clothing</Link>
            <Link href="/about" onClick={() => setMobileOpen(false)} className="hover:text-indigo-600 transition-colors">About</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="hover:text-indigo-600 transition-colors">Contact</Link>
            <Link href="/profile" onClick={() => setMobileOpen(false)} className="hover:text-indigo-600 transition-colors">My Account</Link>
          </div>
        )}
      </nav>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
