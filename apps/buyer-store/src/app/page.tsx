import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Truck, CreditCard, Star } from "lucide-react";

const stats = [
  ["18K+", "Happy Customers"],
  ["80+", "Curated Styles"],
  ["4.8/5", "Average Ratings"],
  ["48H", "Express Dispatch"],
];

const collections = [
  {
    title: "Wedding Edit",
    subtitle: "Statement silhouettes for celebrations",
    href: "/shop?collection=Wedding+Edit",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Festive Drop",
    subtitle: "Rich textures, elevated craftsmanship",
    href: "/shop?category=festive-collection",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Modern Sarees",
    subtitle: "Heritage drapes with modern tailoring",
    href: "/shop?category=sarees",
    image: "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&q=80",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <section className="border-b border-[#291d120f] bg-[#16110d] text-[#eadccc]">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
          <span>Free Shipping Above ₹1499</span>
          <span>Premium Festive Craftsmanship</span>
          <span>Easy Size Exchange</span>
        </div>
      </section>

      <section className="container mx-auto px-4 pt-8 sm:pt-10 pb-6 animate-rise">
        <div className="section-shell overflow-hidden rounded-[2rem]">
          <div className="grid gap-8 lg:grid-cols-2 p-7 sm:p-10 lg:p-14">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a5a2d]">Aurenza Spring Atelier 2026</p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] text-[#18130f]">
                Crafted For Grand Celebrations
              </h1>
              <p className="max-w-xl text-[#4f4032] text-base sm:text-lg leading-relaxed">
                Discover premium sarees, festive gowns, and signature fusion silhouettes by Aurenza. Designed for women who want timeless elegance with contemporary confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/shop" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#19130d] px-7 py-3 text-sm font-semibold text-white hover:bg-[#2b2017] transition-colors">
                  Shop New Season <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/shop?bestseller=true" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#2a1d121f] bg-white px-7 py-3 text-sm font-semibold text-[#2c2117] hover:bg-[#faf4ec] transition-colors">
                  Explore Best Sellers
                </Link>
              </div>
            </div>

            <div className="rounded-[1.6rem] overflow-hidden min-h-[360px] lg:min-h-[460px] relative bg-[#efe4d8]">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140f0a99] via-[#140f0a1f] to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/90 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8a5a2d] font-semibold">Signature Edit</p>
                <p className="mt-1 font-display text-2xl text-[#16110d]">Hand-finished festive pieces</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-[#2a1d120f] p-5 sm:p-6 bg-[#fffdfa]">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-[#2a1d120f] bg-white px-4 py-4">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#18130f]">{value}</p>
                <p className="text-[10px] mt-1 uppercase tracking-[0.16em] text-[#8a5a2d] font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 sm:py-12 animate-rise">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a5a2d] font-semibold">Collection First</p>
            <h2 className="font-display text-4xl text-[#16110d]">Explore Curated Edits</h2>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-[#8a5a2d] hover:underline">View All</Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link key={collection.title} href={collection.href} className="group relative overflow-hidden rounded-[1.8rem] min-h-[360px] section-shell">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${collection.image})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#130d08d9] via-[#130d0833] to-transparent" />
              <div className="absolute left-6 right-6 bottom-6">
                <h3 className="font-display text-3xl text-white">{collection.title}</h3>
                <p className="mt-1 text-sm text-[#eadfce]">{collection.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">Explore <ArrowRight className="h-4 w-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 sm:py-12 animate-rise">
        <div className="texture-card rounded-[2rem] border border-[#2a1d1214] p-7 sm:p-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#2a1d120f] bg-white p-5">
              <ShieldCheck className="h-5 w-5 text-[#8a5a2d]" />
              <h3 className="mt-3 text-lg font-semibold text-[#16110d]">Secure Checkout</h3>
              <p className="mt-1 text-sm text-[#5c4b3b]">Industry-grade payment security and transparent order confirmations.</p>
            </div>
            <div className="rounded-2xl border border-[#2a1d120f] bg-white p-5">
              <Truck className="h-5 w-5 text-[#8a5a2d]" />
              <h3 className="mt-3 text-lg font-semibold text-[#16110d]">Express Delivery</h3>
              <p className="mt-1 text-sm text-[#5c4b3b]">Fast dispatch and real-time status updates from warehouse to doorstep.</p>
            </div>
            <div className="rounded-2xl border border-[#2a1d120f] bg-white p-5">
              <CreditCard className="h-5 w-5 text-[#8a5a2d]" />
              <h3 className="mt-3 text-lg font-semibold text-[#16110d]">Easy Exchanges</h3>
              <p className="mt-1 text-sm text-[#5c4b3b]">Size-exchange support with attentive customer care from Aurenza team.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 sm:pb-20 animate-rise">
        <div className="section-shell rounded-[2rem] p-7 sm:p-10 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8a5a2d] font-semibold">Customer Love</p>
          <h2 className="mt-2 font-display text-4xl text-[#16110d]">Why Shoppers Trust Aurenza</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3 text-left">
            {[
              "Beautiful finishing, true fit, and premium feel exactly as expected.",
              "Wedding order arrived on time and the fabric quality was exceptional.",
              "The support team handled my size exchange quickly and professionally.",
            ].map((quote) => (
              <article key={quote} className="rounded-2xl border border-[#2a1d120f] bg-white p-5">
                <Star className="h-4 w-4 text-[#8a5a2d] fill-[#8a5a2d]" />
                <p className="mt-3 text-sm leading-relaxed text-[#4f4032]">{quote}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
