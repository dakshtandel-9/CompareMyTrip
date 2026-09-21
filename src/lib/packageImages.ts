import { getPackageDetails, type TravelPackage } from "@/lib/packageData";
import { getPackagePageSections, packagePageSectionImages } from "@/lib/packageDetailSections";

/** All saved images, including hotel photos and hidden content, own their uploads. */
export function packageImages(pkg: TravelPackage): string[] {
  const details = getPackageDetails(pkg);
  return [...new Set([
    pkg.image,
    ...details.gallery,
    ...details.stays.map((stay) => stay.image),
    ...packagePageSectionImages(getPackagePageSections(details)),
  ].filter((image): image is string => typeof image === "string" && Boolean(image.trim())))];
}
