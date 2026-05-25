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
    <div className="bg-white">
      <section className="border-b bg-indigo-50/50">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">{eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-gray-600">{intro}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.heading} className="rounded-lg border border-gray-100 bg-gray-50 p-6">
              <h2 className="text-lg font-semibold text-gray-950">{section.heading}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/shop" className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
            Continue Shopping
          </Link>
          <Link href="/" className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50">
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
