import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import PackageDetailClient from "./PackageDetailClient";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { getPublishedPackage } from "@/lib/serverContent";

export const revalidate = 3600;

type PackagePageProps = { params: Promise<{ packageId: string }> };

function packageDescription(pkg: Awaited<ReturnType<typeof getPublishedPackage>>) {
  if (!pkg) return "";
  const authoredSummary = pkg.details?.summary?.trim();
  if (authoredSummary) return authoredSummary;
  return `${pkg.title} is a ${pkg.days}-day, ${pkg.nights}-night travel package covering ${pkg.location}, priced at ₹${pkg.price.toLocaleString("en-IN")} per person.`;
}

export async function generateMetadata({ params }: PackagePageProps): Promise<Metadata> {
  const { packageId } = await params;
  const pkg = await getPublishedPackage(packageId);
  if (!pkg) return { title: "Package Not Found", robots: { index: false, follow: false } };

  const canonicalPath = pkg.href || `/packages/${pkg.id}`;
  return createPageMetadata({
    title: pkg.title,
    description: packageDescription(pkg),
    path: canonicalPath,
    image: pkg.image,
    imageAlt: `${pkg.title} in ${pkg.location}`,
  });
}

export default async function PackageDetailPage({ params }: PackagePageProps) {
  const { packageId } = await params;
  const pkg = await getPublishedPackage(packageId);
  if (!pkg) notFound();
  if (pkg.href && pkg.href !== `/packages/${packageId}`) permanentRedirect(pkg.href);

  const packageUrl = absoluteUrl(`/packages/${pkg.id}`);
  const schemaImages = pkg.details?.gallery?.length ? pkg.details.gallery : [pkg.image];

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
              { "@type": "ListItem", position: 2, name: "Holiday packages", item: absoluteUrl("/packages") },
              { "@type": "ListItem", position: 3, name: pkg.title, item: packageUrl },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: pkg.title,
            description: packageDescription(pkg),
            image: schemaImages.map(absoluteUrl),
            category: "Travel package",
            url: packageUrl,
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: pkg.price,
              url: packageUrl,
            },
          },
        ]}
      />
      <PackageDetailClient initialPackage={pkg} />
      <Footer />
    </>
  );
}
