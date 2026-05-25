import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 text-gray-600">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold text-indigo-950">Aurenza</h3>
            <p className="text-sm leading-relaxed">
              Premium clothing with elevated styling and dependable nationwide delivery.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="hover:text-indigo-600 transition-colors">All Products</Link></li>
              <li><Link href="/shop?category=clothing" className="hover:text-indigo-600 transition-colors">Clothing</Link></li>
              <li><Link href="/shop?search=new" className="hover:text-indigo-600 transition-colors">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-indigo-600 transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-indigo-600 transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} Aurenza. All rights reserved.</p>
          <p className="mt-2 text-xs text-gray-400">Operated by Hemlata Dubey (Sole Proprietorship)</p>
        </div>
      </div>
    </footer>
  );
}
