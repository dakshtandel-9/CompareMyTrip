import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import PackageCard from "@/app/home/_components/PackageCard";
import { getPublishedPackages } from "@/lib/serverContent";
import { BENGALURU_COLLECTIONS, BENGALURU_FAQS, collectionPackages } from "@/lib/bengaluruCollections";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";

export const revalidate = 86400; // 24 hours
type Props = { params: Promise<{ collection: string }> };
export function generateStaticParams() { return BENGALURU_COLLECTIONS.map(item => ({ collection: item.slug })); }
export async function generateMetadata({ params }: Props) {
  const { collection } = await params;
  const item = BENGALURU_COLLECTIONS.find(item => item.slug === collection);
  if (!item) return { title: "Collection not found", robots: { index: false } };
  return createPageMetadata({ title: item.title, description: item.description, path: `/bengaluru/${item.slug}`, image: item.image });
}
export default async function BengaluruCollection({ params }: Props) {
  const { collection } = await params;
  const item = BENGALURU_COLLECTIONS.find(item => item.slug === collection);
  if (!item) notFound();
  const packages = collectionPackages(await getPublishedPackages(), collection);
  return <><Header /><main>
    <section className="relative isolate overflow-hidden bg-cmt-secondary-900 px-5 py-16 text-white sm:py-24">
      <Image src={item.image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-black/70" />
      <div className="mx-auto max-w-7xl"><Link href="/bengaluru" className="text-sm text-cmt-primary-400">Bengaluru travel</Link><h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold sm:text-5xl">{item.title}</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">{item.description}</p><a href="#trips" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-cmt-primary-500 px-6 font-semibold text-cmt-neutral-900">Explore trips</a></div>
    </section>
    <section id="trips" className="mx-auto max-w-7xl px-5 py-12"><h2 className="font-display text-3xl font-semibold">Find your next break</h2><p className="mt-3 text-cmt-neutral-600">{packages.length ? `${packages.length} matching plans. Check your preferred date with the team; scheduled departures are subject to availability.` : "No matching Bengaluru departures are currently listed. Tell us your dates and preferences so our team can check suitable options."}</p>
      <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}</div>
      <Link href="/contact" className="mt-8 inline-flex min-h-12 items-center rounded-xl border border-cmt-neutral-300 px-6 font-semibold">Plan my trip</Link>
    </section>
    <section className="bg-cmt-neutral-50 px-5 py-12"><div className="mx-auto max-w-7xl"><h2 className="font-display text-3xl font-semibold">Before you choose</h2><div className="mt-7 grid gap-6 md:grid-cols-3">{item.tips.map(tip => <article key={tip.title} className="rounded-2xl border border-cmt-neutral-200 bg-white p-6"><h3 className="font-display text-xl font-semibold">{tip.title}</h3><p className="mt-3 leading-7 text-cmt-neutral-600">{tip.body}</p></article>)}</div></div></section>
    <section className="mx-auto max-w-4xl px-5 py-12"><h2 className="font-display text-3xl font-semibold">Planning from Bengaluru (Bangalore)</h2><div className="mt-6 divide-y divide-cmt-neutral-200">{BENGALURU_FAQS.map(faq => <details key={faq.question} className="py-5"><summary className="cursor-pointer font-semibold">{faq.question}</summary><p className="mt-3 leading-7 text-cmt-neutral-600">{faq.answer}</p></details>)}</div><nav aria-label="More Bengaluru collections" className="mt-8 flex flex-wrap gap-4">{BENGALURU_COLLECTIONS.filter(other => other.slug !== collection).map(other => <Link className="underline underline-offset-4" key={other.slug} href={`/bengaluru/${other.slug}`}>{other.title}</Link>)}</nav></section>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Bengaluru", item: absoluteUrl("/bengaluru") }, { "@type": "ListItem", position: 3, name: item.title, item: absoluteUrl(`/bengaluru/${collection}`) }] }} />
  </main><Footer /></>;
}
