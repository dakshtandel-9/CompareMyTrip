import type { TravelPackage } from "@/lib/packageData";

/* Public package URLs are built from the title — /packages/kurinjal-trek —
   rather than the document id, which carries a creation-time suffix
   (kurinjal-trek-mu9hj922) and keeps the name a package had when it was first
   created, even after a rename. The id stays the internal key: payments,
   enquiries and saved trips refer to it, so it is never changed. */

/** Folders under src/app/packages. A slug equal to one would be shadowed by it. */
const RESERVED_SLUGS = new Set(["kerala-backwaters-hills-escape"]);

type Linkable = Pick<TravelPackage, "id" | "title" | "slug" | "href">;
type Addressable = Pick<TravelPackage, "id" | "title" | "slug" | "previousSlugs">;

export function slugifyPackageTitle(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The URL segment for a package. A package not saved since slugs were added
    has none stored and takes it from its title, which is what the CRM will
    store the next time it is saved. */
export function packageSlug(pkg: Pick<TravelPackage, "id" | "title" | "slug">) {
  return pkg.slug?.trim() || slugifyPackageTitle(pkg.title) || pkg.id;
}

/** Where a link to this package should point. An `href` that merely spells out
    the old id URL is treated as no override. */
export function packagePath(pkg: Linkable) {
  const href = pkg.href?.trim();
  if (href && href !== `/packages/${pkg.id}`) return href;
  return `/packages/${packageSlug(pkg)}`;
}

/** The package a /packages/<segment> URL refers to: its current slug first,
    then the id and earlier slugs that older links still use. */
export function findPackageBySegment<T extends Addressable>(segment: string, packages: T[]) {
  return packages.find((pkg) => packageSlug(pkg) === segment)
    ?? packages.find((pkg) => pkg.id === segment)
    ?? packages.find((pkg) => pkg.previousSlugs?.includes(segment))
    ?? null;
}

/** The package a stored /packages/... link points at, whichever form it uses. */
export function findPackageByPath<T extends Addressable>(path: string, packages: T[]) {
  const match = /^\/packages\/([^/?#]+)$/.exec(path.trim());
  return match ? findPackageBySegment(decodeURIComponent(match[1]), packages) : null;
}

/** `wanted`, or `wanted-2`, `wanted-3`… — the first that no other package uses
    as its slug, id or former slug. */
export function uniquePackageSlug(wanted: string, packages: Addressable[], selfId?: string) {
  const taken = new Set(RESERVED_SLUGS);
  for (const pkg of packages) {
    if (pkg.id === selfId) continue;
    taken.add(packageSlug(pkg));
    taken.add(pkg.id);
    pkg.previousSlugs?.forEach((slug) => taken.add(slug));
  }
  if (!taken.has(wanted)) return wanted;
  let n = 2;
  while (taken.has(`${wanted}-${n}`)) n += 1;
  return `${wanted}-${n}`;
}

/** The slug fields to store when the CRM saves `next`. A package keeps its URL
    while its title still produces it; a rename moves it to the new title and
    remembers the old one so existing links redirect. */
export function slugFieldsForSave(next: Pick<TravelPackage, "id" | "title">, previous: Addressable | undefined, packages: Addressable[]) {
  const titleSlug = slugifyPackageTitle(next.title);
  const current = previous ? packageSlug(previous) : "";
  const renamed = !previous || (titleSlug && titleSlug !== slugifyPackageTitle(previous.title));
  const slug = uniquePackageSlug(renamed ? titleSlug || next.id : current, packages, next.id);
  const previousSlugs = [...new Set([...(previous?.previousSlugs ?? []), ...(current && current !== slug ? [current] : [])])]
    .filter((item) => item !== slug);
  return { slug, ...(previousSlugs.length ? { previousSlugs } : {}) };
}
