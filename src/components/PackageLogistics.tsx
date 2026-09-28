import { packageLogistics } from "@/lib/bengaluruTravel";
import type { TravelPackage } from "@/lib/packageData";
export default function PackageLogistics({ pkg }: { pkg: TravelPackage }) {
  return <ul aria-label="Departure and transport" className="mt-3 space-y-1 text-xs leading-5 text-cmt-neutral-600">{packageLogistics(pkg).map(text => <li key={text}>{text}</li>)}</ul>;
}
