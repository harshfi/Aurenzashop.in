import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#22180e1a] bg-[#16110d] text-[#e9dccf]">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-2xl font-display font-bold text-white">Aurenza</h3>
            <p className="text-sm leading-relaxed text-[#dbcbb9]">
              Premium direct-to-consumer fashion house for elevated ethnic silhouettes, crafted details, and timeless celebration wear.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#f3e6d8]">Collections</h4>
            <ul className="space-y-2 text-sm text-[#dbcbb9]">
              <li><Link href="/shop?category=sarees" className="hover:text-white transition-colors">Saree Edit</Link></li>
              <li><Link href="/shop?category=gowns" className="hover:text-white transition-colors">Evening Gowns</Link></li>
              <li><Link href="/shop?category=fusion-wear" className="hover:text-white transition-colors">Fusion Wear</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#f3e6d8]">Support</h4>
            <ul className="space-y-2 text-sm text-[#dbcbb9]">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#f3e6d8]">Trust & Legal</h4>
            <ul className="space-y-2 text-sm text-[#dbcbb9]">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">My Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[#ffffff1f] pt-8 text-center text-sm text-[#cbb9a5]">
          <p>© {new Date().getFullYear()} Aurenza. All rights reserved.</p>
          <p className="mt-1 text-xs text-[#a79179]">Luxury fashion, responsibly crafted in India.</p>
        </div>
      </div>
    </footer>
  );
}
