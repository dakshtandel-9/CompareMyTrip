import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin, Wallet } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import PackageCard from "@/app/home/_components/PackageCard";
import {
  buildDestinations,
  destinationHref,
  destinationSlug,
  durationLabel,
  findDestinationBySlug,
  packagesForDestination,
  type DestinationSummary,
} from "@/lib/destinations";
import { isIndexablePackage } from "@/lib/packageData";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import {
  getDestinationCovers,
  getPublishedBlogPosts,
  getPublishedPackages,
} from "@/lib/serverContent";

/* ------------------------------------------------------------------ */
/* One indexable page per destination.                                  */
/*                                                                      */
/* /destinations is a single client-filtered grid: useful to browse,    */
/* but it gives a search engine one URL for every place we sell. This    */
/* route gives "Kerala tour packages" somewhere to land — server         */
/* rendered, with the packages actually filed under that destination.    */
/*                                                                      */
/* Nothing here is authored per destination. The page is built from the  */
/* catalogue, so a place gets its page the moment a package is filed     */
/* under it and loses it when the last one goes — the same rule the      */
/* /destinations grid follows.                                          */
/* ------------------------------------------------------------------ */

export const revalidate = 3600;

type DestinationPageProps = { params: Promise<{ slug: string }> };

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

async function loadDestination(slug: string) {
  const [packages, covers] = await Promise.all([
    getPublishedPackages(),
    getDestinationCovers(),
  ]);
  const destination = findDestinationBySlug(buildDestinations(packages, covers), slug);
  if (!destination) return null;
  return { destination, packages: packagesForDestination(packages, destination.name) };
}

/* Every destination that has at least one package. Prerendering them means a
   crawler's first visit is served from the cache instead of paying for a cold
   Firestore read; anything filed later is still rendered on demand. */
export async function generateStaticParams() {
  const destinations = buildDestinations(await getPublishedPackages());
  return destinations.map((destination) => ({ slug: destinationSlug(destination.name) }));
}

/* Written from the catalogue rather than a template with the name dropped in:
   the count, the price and the trip lengths are what makes one destination's
   description different from the next one's. */
function describe(destination: DestinationSummary): string {
  const count = `${destination.count} ${destination.count === 1 ? "holiday package" : "holiday packages"}`;
  const duration = durationLabel(destination);
  const parts = [
    `Compare ${count} in ${destination.name}`,
    duration ? `lasting ${duration}` : "",
    `from ${formatINR(destination.fromPrice)} per person`,
  ].filter(Boolean);
  return `${parts.join(", ")}. Itineraries, inclusions and cancellation terms, side by side.`;
}

export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = await loadDestination(slug);
  if (!found) return { title: "Destination Not Found", robots: { index: false, follow: false } };

  const { destination, packages } = found;
  return createPageMetadata({
    title: `${destination.name} Tour Packages`,
    description: describe(destination),
    path: destinationHref(destination.name),
    image: destination.image || undefined,
    imageAlt: `Travel photography from ${destination.name}`,
    /* A destination whose every package is withheld from search would be an
       empty page in the index. It still serves, it just is not advertised. */
    index: packages.some(isIndexablePackage),
  });
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const found = await loadDestination(slug);
  if (!found) notFound();

  const { destination, packages } = found;
  /* The lookup slugifies whatever it is given, so /destinations/Kerala and
     /destinations/kerala both resolve. Only one of them is the page: send the
     rest on rather than serving the same content at several URLs. */
  const canonicalSlug = destinationSlug(destination.name);
  if (slug !== canonicalSlug) permanentRedirect(destinationHref(destination.name));

  const pageUrl = absoluteUrl(destinationHref(destination.name));
  const duration = durationLabel(destination);
  const catalogueHref = `/packages?destination=${encodeURIComponent(destination.name)}`;

  /* Guides already written about this place. Real internal links, not a
     "related" rail padded out with whatever is newest. */
  const guides = (await getPublishedBlogPosts())
    .filter((post) => post.destination && destinationSlug(post.destination) === destinationSlug(destination.name))
    .slice(0, 3);

  const facts = [
    { icon: MapPin, label: "Packages", value: String(destination.count) },
    { icon: Wallet, label: "From", value: `${formatINR(destination.fromPrice)} / person` },
    ...(duration ? [{ icon: CalendarDays, label: "Trip length", value: duration }] : []),
  ];

  return (
    <>
      <Header />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Destinations", item: absoluteUrl("/destinations") },
              { "@type": "ListItem", position: 3, name: destination.name, item: pageUrl },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${destination.name} holiday packages`,
            numberOfItems: packages.filter(isIndexablePackage).length,
            itemListElement: packages
              .filter(isIndexablePackage)
              .map((pkg, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: pkg.title,
                url: absoluteUrl(pkg.href || `/packages/${pkg.id}`),
              })),
          },
        ]}
      />

      <main className="bg-white">
        <section className="relative isolate overflow-hidden bg-cmt-neutral-900 text-white">
          {destination.image && (
            <Image
              src={destination.image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-45"
            />
          )}
          <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <nav aria-label="Breadcrumb" className="text-xs font-medium text-white/70">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href="/destinations" className="hover:text-white">Destinations</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-white">{destination.name}</li>
              </ol>
            </nav>

            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {destination.name} Tour Packages
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
              {describe(destination)}
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-center gap-2.5">
                  <fact.icon className="size-5 shrink-0 text-cmt-primary-500" strokeWidth={2} />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">{fact.label}</dt>
                    <dd className="font-display text-base font-semibold">{fact.value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            {destination.styles.length > 0 && (
              <ul className="mt-7 flex flex-wrap gap-2">
                {destination.styles.map((style) => (
                  <li key={style} className="rounded-cmt-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
                    {style}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold tracking-tight text-cmt-neutral-900 sm:text-3xl">
              {destination.count === 1
                ? `1 package in ${destination.name}`
                : `${destination.count} packages in ${destination.name}`}
            </h2>
            <Link
              href={catalogueHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-cmt-neutral-900 underline-offset-4 hover:underline"
            >
              Filter and compare <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ))}
          </div>
        </section>

        {guides.length > 0 && (
          <section className="border-t border-cmt-neutral-200 bg-cmt-neutral-50">
            <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <h2 className="font-display text-2xl font-bold tracking-tight text-cmt-neutral-900 sm:text-3xl">
                {destination.name} travel guides
              </h2>
              <ul className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {guides.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/blog/${post.id}`}
                      className="flex h-full flex-col rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm transition-shadow hover:shadow-cmt-md"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cmt-primary-700">
                        {post.category}
                      </span>
                      <span className="mt-2 font-display text-base font-bold leading-snug text-cmt-neutral-900">
                        {post.title}
                      </span>
                      {post.excerpt && (
                        <span className="mt-2 line-clamp-3 text-sm leading-6 text-cmt-neutral-600">{post.excerpt}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
