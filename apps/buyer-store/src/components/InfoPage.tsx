import Link from "next/link";

type InfoPageProps = {
  title: string;
  eyebrow: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export default function InfoPage({ title, eyebrow, intro, sections }: InfoPageProps) {
  return (
    <div className="bg-[#f9f5ef]">
      <section className="border-b border-[#2a1d120f] bg-[#f7efe3]">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a5a2d]">{eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-display font-bold tracking-tight text-[#1d150f] md:text-5xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#5c4b3b]">{intro}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section, idx) => (
            <article key={section.heading} className="rounded-2xl border border-[#2a1d120f] bg-white p-6 shadow-sm animate-rise" style={{ animationDelay: `${idx * 80}ms` }}>
              <h2 className="text-lg font-semibold text-[#20160f]">{section.heading}</h2>
              <p className="mt-3 text-sm leading-6 text-[#5c4b3b]">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/shop" className="rounded-full bg-[#19130d] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2b2017]">
            Continue Shopping
          </Link>
          <Link href="/" className="rounded-full border border-[#2a1d120f] bg-white px-6 py-3 text-sm font-semibold text-[#2b2017] transition-colors hover:bg-[#f7efe3]">
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
