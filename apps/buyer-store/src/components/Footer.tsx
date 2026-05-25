export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 text-gray-600">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold text-indigo-950">Aurenza</h3>
            <p className="text-sm leading-relaxed">
              Premium clothing and elegant wallpapers. Elevate your style and your space.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/shop" className="hover:text-indigo-600 transition-colors">All Products</a></li>
              <li><a href="/shop?category=Clothing" className="hover:text-indigo-600 transition-colors">Clothing</a></li>
              <li><a href="/shop?category=Wallpapers" className="hover:text-indigo-600 transition-colors">Wallpapers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/contact" className="hover:text-indigo-600 transition-colors">Contact Us</a></li>
              <li><a href="/faq" className="hover:text-indigo-600 transition-colors">FAQ</a></li>
              <li><a href="/shipping" className="hover:text-indigo-600 transition-colors">Shipping & Returns</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
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
