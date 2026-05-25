import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200/70 bg-[linear-gradient(180deg,#fffdf7,white_35%,#f5efe4)] text-stone-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold tracking-[0.18em] text-stone-900">AURENZA</h3>
            <p className="text-sm leading-relaxed text-stone-600">
              Elevated clothing and statement wallpaper collections designed to make everyday spaces feel collected.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-stone-900">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="transition-colors hover:text-amber-700">All Products</Link></li>
              <li><Link href="/shop?category=clothing" className="transition-colors hover:text-amber-700">Clothing</Link></li>
              <li><Link href="/shop?category=wallpaper" className="transition-colors hover:text-amber-700">Wallpaper</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-stone-900">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="transition-colors hover:text-amber-700">Contact Us</Link></li>
              <li><Link href="/faq" className="transition-colors hover:text-amber-700">FAQ</Link></li>
              <li><Link href="/shipping" className="transition-colors hover:text-amber-700">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-stone-900">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="transition-colors hover:text-amber-700">Privacy Policy</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-amber-700">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-stone-200/70 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} Aurenza. All rights reserved.</p>
          <p className="mt-2 text-xs text-stone-400">Operated by Hemlata Dubey (Sole Proprietorship)</p>
        </div>
      </div>
    </footer>
  );
}
