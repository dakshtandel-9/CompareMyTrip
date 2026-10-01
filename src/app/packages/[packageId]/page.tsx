
import { plainPackageText } from "@/lib/packageRichText";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import PackageDetailClient from "./PackageDetailClient";
import { isIndexablePackage } from "@/lib/packageData";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { getPublishedPackageForUrl, getPublishedPackages } from "@/lib/serverContent";
import { packagePath, packageSlug } from "@/lib/packageUrls";
import { getSimilarPackages } from "@/lib/similarPackages";

export const revalidate = 86400; // 24 hours

type PackagePageProps = { params: Promise<{ packageId: string }> };

/* Same reasoning as the blog: the catalogue is known at build time, so the
   pages a crawler will ask for first are already built. A package added later
   is rendered on demand. Packages that redirect elsewhere via `href` are left
   out — prerendering a permanent redirect gains nothing. The segment is the
   slug; old id and renamed-title URLs are served on demand as redirects. */
export async function generateStaticParams() {
  const packages = await getPublishedPackages();
  return packages
    .filter((pkg) => packagePath(pkg) === `/packages/${packageSlug(pkg)}`)
    .map((pkg) => ({ packageId: packageSlug(pkg) }));
}

function packageDescription(pkg: Awaited<ReturnType<typeof getPublishedPackageForUrl>>) {
  if (!pkg) return "";
  const authoredSummary = plainPackageText(pkg.details?.summary ?? "").trim();
  if (authoredSummary) return authoredSummary;
  return `${pkg.title} is a ${pkg.days}-day, ${pkg.nights}-night travel package covering ${pkg.location}, priced at ₹${pkg.price.toLocaleString("en-IN")} per person.`;
}

export async function generateMetadata({ params }: PackagePageProps): Promise<Metadata> {
  const { packageId } = await params;
  const pkg = await getPublishedPackageForUrl(packageId);
  if (!pkg) return { title: "Package Not Found", robots: { index: false, follow: false } };

  const canonicalPath = packagePath(pkg);
  return createPageMetadata({
    title: pkg.title,
    description: packageDescription(pkg),
    path: canonicalPath,
    image: pkg.image,
    imageAlt: `${pkg.title} in ${pkg.location}`,
    // The page still serves whoever holds the link; it just does not go into
    // the index carrying a half-finished title.
    index: isIndexablePackage(pkg),
  });
}

export default async function PackageDetailPage({ params }: PackagePageProps) {
  const { packageId } = await params;
  const pkg = await getPublishedPackageForUrl(packageId);
  if (!pkg) notFound();
  // Old id URLs, former titles and `href` overrides all land on one address.
  const path = packagePath(pkg);
  if (path !== `/packages/${packageId}`) permanentRedirect(path);

  const packageUrl = absoluteUrl(path);
  const schemaImages = pkg.details?.gallery?.length ? pkg.details.gallery : [pkg.image];
  const similarPackages = getSimilarPackages(pkg, await getPublishedPackages());

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
      <PackageDetailClient initialPackage={pkg} initialSimilarPackages={similarPackages} />
      <Footer />
    </>
  );
}
