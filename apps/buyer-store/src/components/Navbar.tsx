"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useCartHydrated } from "@/store/useCartHydrated";
import CartDrawer from "@/components/CartDrawer";
import { PRODUCT_CATEGORIES } from "@/lib/products";

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartHydrated = useCartHydrated();
  const totalItems = useCartStore((state) => state.totalItems());
  const showCartCount = cartHydrated && totalItems > 0;
  const navigationLinks = PRODUCT_CATEGORIES.filter((category) => category.value !== "all");

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-stone-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#f6d7a7,#d97706_60%,#7c2d12)] text-sm font-bold uppercase tracking-[0.35em] text-white shadow-lg shadow-amber-200/70">
                A
              </span>
              <div>
                <p className="text-lg font-semibold tracking-[0.18em] text-stone-900">AURENZA</p>
                <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">Curated living</p>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
              <Link href="/shop" className="transition-colors hover:text-amber-700">Shop</Link>
              {navigationLinks.map((link) => (
                <Link key={link.value} href={link.href} className="transition-colors hover:text-amber-700">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="rounded-full p-2.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-amber-700"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="group relative rounded-full p-2.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-amber-700"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {showCartCount && (
                <span className="absolute right-1 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] font-bold text-white transition-transform group-hover:scale-110">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="rounded-full p-2.5 text-stone-600 transition-colors hover:bg-stone-100 md:hidden"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="border-t border-stone-200/70 bg-white/95 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium text-stone-700">
              <Link href="/shop" className="rounded-2xl px-4 py-3 transition-colors hover:bg-stone-100" onClick={() => setIsMobileMenuOpen(false)}>
                Shop All
              </Link>
              {navigationLinks.map((link) => (
                <Link
                  key={link.value}
                  href={link.href}
                  className="rounded-2xl px-4 py-3 transition-colors hover:bg-stone-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
