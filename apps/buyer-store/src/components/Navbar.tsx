"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, User, Menu, X, Search, Sparkles } from "lucide-react";
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

  const links = [
    { href: "/shop?collection=Wedding+Edit", label: "Wedding Edit" },
    { href: "/shop?collection=Festive+Drop", label: "Festive Drop" },
    { href: "/shop?newArrival=true", label: "New Arrivals" },
    { href: "/shop?bestseller=true", label: "Best Sellers" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-[#1a130a1f] bg-[#f9f5ef]/85 backdrop-blur-xl">
        <div className="container mx-auto flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-2xl font-display font-bold tracking-tight text-[#19130d]">
              <Sparkles className="h-5 w-5 text-[#8a5a2d]" />
              Aurenza
            </Link>
            <div className="hidden xl:flex gap-5 text-sm font-semibold text-[#44372b]">
              {links.map((link) => (
                <Link key={link.label} href={link.href} className="hover:text-[#8a5a2d] transition-colors">{link.label}</Link>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7e71]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sarees, gowns, kurta sets..."
                className="h-10 w-full rounded-full border border-[#2d20110f] bg-white pl-9 pr-4 text-sm outline-none transition-colors focus:border-[#8a5a2d66]"
              />
            </div>
            <button
              type="submit"
              className="h-10 rounded-full bg-[#19130d] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2c2117]"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Link href="/profile" className="p-2 text-[#4a3f34] hover:text-[#8a5a2d] transition-colors" aria-label="Profile">
              <User className="h-5 w-5" />
            </Link>
            <button
              id="cart-toggle-btn"
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-[#4a3f34] hover:text-[#8a5a2d] transition-colors group"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#19130d] text-[10px] font-bold text-white group-hover:scale-110 transition-transform">
                  {totalItems}
                </span>
              )}
            </button>
            <button className="lg:hidden p-2 text-[#4a3f34]" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-[#2f21120f] bg-[#fbf8f2] px-4 py-4 flex flex-col gap-4 text-sm font-semibold text-[#4a3f34]">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7e71]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products"
                  className="h-10 w-full rounded-full border border-[#2d20110f] bg-white pl-9 pr-4 text-sm outline-none transition-colors focus:border-[#8a5a2d66]"
                />
              </div>
              <button type="submit" className="h-10 rounded-full bg-[#19130d] px-4 text-xs font-semibold text-white hover:bg-[#2c2117]">
                Search
              </button>
            </form>
            {links.map((link) => (
              <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="hover:text-[#8a5a2d] transition-colors">{link.label}</Link>
            ))}
            <Link href="/shop" onClick={() => setMobileOpen(false)} className="hover:text-[#8a5a2d] transition-colors">Shop All</Link>
            <Link href="/profile" onClick={() => setMobileOpen(false)} className="hover:text-[#8a5a2d] transition-colors">My Account</Link>
          </div>
        )}
      </nav>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
