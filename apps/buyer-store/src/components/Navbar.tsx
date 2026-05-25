"use client";

import Link from "next/link";
import { ShoppingBag, User, Menu } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export default function Navbar() {
  const totalItems = useCartStore((state) => state.totalItems());

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-indigo-950">
            Aurenza
          </Link>
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
            <Link href="/shop" className="hover:text-indigo-600 transition-colors">Shop</Link>
            <Link href="/shop?category=Clothing" className="hover:text-indigo-600 transition-colors">Clothing</Link>
            <Link href="/shop?category=Wallpapers" className="hover:text-indigo-600 transition-colors">Wallpapers</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/profile" className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
            <User className="h-5 w-5" />
          </Link>
          <button className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors group">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white group-hover:scale-110 transition-transform">
                {totalItems}
              </span>
            )}
          </button>
          <button className="md:hidden p-2 text-gray-600">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
