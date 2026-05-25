import Link from "next/link";
import { ArrowRight, Paintbrush, ShoppingBag, Sparkles } from "lucide-react";

const featuredCollections = [
  {
    title: "Clothing",
    subtitle: "Tailored ease",
    href: "/shop?category=clothing",
    description: "Premium silhouettes with clean lines, thoughtful fabrics, and an elevated everyday feel.",
    image:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop",
    icon: ShoppingBag,
  },
  {
    title: "Wallpaper",
    subtitle: "Atmosphere first",
    href: "/shop?category=wallpaper",
    description: "Murals and textures that shift a room from functional to unforgettable in a single wall.",
    image:
      "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1200&auto=format&fit=crop",
    icon: Paintbrush,
  },
];

export default function Home() {
  return (
    <div className="bg-[linear-gradient(180deg,#fffcf7_0%,#fff4e7_24%,#ffffff_58%)]">
      <section className="relative overflow-hidden border-b border-stone-200/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(120,53,15,0.12),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Premium edits
            </div>
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-stone-500">Aurenza buyer store</p>
              <h1 className="max-w-2xl text-5xl font-semibold tracking-[-0.06em] text-stone-900 sm:text-6xl lg:text-7xl">
                Style your wardrobe and your walls with the same eye.
              </h1>
              <p className="max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
                Aurenza brings together refined clothing and design-led wallpaper so your personal style
                feels consistent, collected, and unmistakably yours.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-7 py-4 text-sm font-semibold text-white transition-all hover:bg-amber-700"
              >
                Explore the shop
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/shop?category=wallpaper"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-7 py-4 text-sm font-semibold text-stone-700 transition-all hover:border-amber-200 hover:text-amber-700"
              >
                View wallpaper edit
              </Link>
            </div>
            <div className="grid max-w-xl gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Collections</p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">2</p>
              </div>
              <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Curated feel</p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">100%</p>
              </div>
              <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Fast checkout</p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">Ready</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {featuredCollections.map((collection) => {
              const Icon = collection.icon;

              return (
                <Link
                  key={collection.title}
                  href={collection.href}
                  className="group relative overflow-hidden rounded-[2rem] border border-stone-200/80 p-8 text-white shadow-[0_20px_50px_rgba(28,25,23,0.12)]"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${collection.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/30 to-transparent" />
                  <div className="relative flex min-h-[280px] flex-col justify-end">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/75">{collection.subtitle}</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{collection.title}</h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">{collection.description}</p>
                    <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium">
                      Discover collection
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-18">
        <div className="grid gap-5 rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm lg:grid-cols-3 lg:p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Why Aurenza</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-900">
              Thoughtful products, not endless noise.
            </h2>
          </div>
          <div className="rounded-[1.5rem] bg-stone-50 p-5">
            <p className="text-sm font-semibold text-stone-900">Premium materials</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              We focus on finishes, drape, and tactile richness so each item feels worth keeping.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-stone-50 p-5">
            <p className="text-sm font-semibold text-stone-900">Spaces with character</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Our wallpaper selection is built to change the mood of a room without becoming overwhelming.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
