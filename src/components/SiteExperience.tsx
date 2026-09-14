"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { bypassComingSoon } from "@/lib/comingSoon";
import { useSiteContentState } from "@/lib/useSiteContent";
import { useAdminPreview } from "@/lib/firebase/useAdminPreview";
import { getAuthDestination } from "@/lib/firebase/authDestination";
import ComingSoonScreen from "./ComingSoonScreen";
import FloatingActions from "./FloatingActions";
import MobileNavigation from "./MobileNavigation";
import ProfileCompletionGate from "./ProfileCompletionGate";
import TripPlanPromptDialog from "./TripPlanPromptDialog";

export default function SiteExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { content, loading } = useSiteContentState();
  const preview = useAdminPreview(pathname);
  const maintenance = !loading && content.comingSoon.enabled;
  const paused = maintenance && !bypassComingSoon(pathname) && preview !== "authorized";
  const customPayment = pathname === "/pay" || pathname === "/pay/status";

  // Middleware handles fresh requests; this covers already open pages and
  // routes held in the browser's client navigation cache.
  useEffect(() => {
    if (paused && preview === "denied") {
      const next = window.location.pathname + window.location.search + window.location.hash;
      router.replace(`/coming-soon?${new URLSearchParams({ next })}`);
    } else if (maintenance && pathname === "/coming-soon" && preview === "authorized") {
      const next = getAuthDestination(window.location.search, window.location.origin);
      router.replace(next.split(/[?#]/)[0] === "/coming-soon" ? "/" : next);
    }
  }, [paused, preview, maintenance, pathname, router]);

  if (maintenance && preview === "checking" && (paused || pathname === "/coming-soon")) {
    return <main className="grid min-h-dvh place-items-center bg-cmt-neutral-50" aria-busy="true"><p role="status" className="text-sm text-cmt-neutral-600">Checking website access…</p></main>;
  }
  if (pathname === "/coming-soon") return children;
  if (paused) return <ComingSoonScreen />;
  // Authentication and administration have their own access gates. Customer
  // onboarding must never block an administrator from reopening the website.
  if (/^\/(admin|login|signup|forgot-password)(\/|$)/.test(pathname)) return children;

  return <>
    {customPayment || preview === "authorized" ? children : <ProfileCompletionGate>{children}</ProfileCompletionGate>}
    {!customPayment && preview !== "authorized" && <TripPlanPromptDialog />}
    <FloatingActions />
    <MobileNavigation />
  </>;
}
