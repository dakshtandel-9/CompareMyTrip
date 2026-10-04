"use client";

import dynamic from "next/dynamic";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { bypassComingSoon } from "@/lib/comingSoon";
import { refreshComingSoonStatus, useComingSoonStatus } from "@/lib/comingSoonStatus";
import { useAdminPreview } from "@/lib/firebase/useAdminPreview";
import { getAuthDestination } from "@/lib/firebase/authDestination";
import ComingSoonScreen from "./ComingSoonScreen";
import FloatingActions from "./FloatingActions";
import MobileNavigation from "./MobileNavigation";
import TripPlanPromptDialog from "./TripPlanPromptDialog";

const ProfileCompletionGate = dynamic(() => import("./ProfileCompletionGate"), { ssr: false });

export default function SiteExperience({ children }: { children: React.ReactNode }) {
  const user = useAuthUser();
  const pathname = usePathname();
  const router = useRouter();
  const preview = useAdminPreview(pathname);
  const localPackageDemo = process.env.NODE_ENV === "development" && /^\/package-page-[1-4]\/?$/.test(pathname);
  const maintenance = useComingSoonStatus() === true;
  const paused = maintenance && !localPackageDemo && !bypassComingSoon(pathname) && preview !== "authorized";
  const customPayment = pathname === "/pay" || pathname === "/pay/status";

  // Middleware handles fresh requests; this covers already open pages and
  // routes held in the browser's client navigation cache. The switch is
  // re-read on client navigation and when the visitor returns to the tab.
  const lastPathname = useRef<string | null>(null);
  useEffect(() => {
    const navigated = lastPathname.current !== null && lastPathname.current !== pathname;
    lastPathname.current = pathname;
    if (navigated || pathname === "/coming-soon") void refreshComingSoonStatus();
  }, [pathname]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshComingSoonStatus();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    if (paused && preview === "denied") {
      const next = window.location.pathname + window.location.search + window.location.hash;
      router.replace(`/coming-soon?${new URLSearchParams({ next })}`);
    } else if (maintenance && pathname === "/coming-soon" && preview === "authorized") {
      const next = getAuthDestination(window.location.search, window.location.origin);
      router.replace(next.split(/[?#]/)[0] === "/coming-soon" ? "/" : next);
    }
  }, [paused, preview, maintenance, pathname, router]);

  // Isolated local design previews have their own controls and no lead forms.
  if (localPackageDemo) return children;
  // The coming-soon page itself stays up while an administrator is checked.
  if (maintenance && preview === "checking" && paused) {
    return <main className="grid min-h-dvh place-items-center bg-cmt-neutral-50" aria-busy="true"><p role="status" className="text-sm text-cmt-neutral-600">Checking website access…</p></main>;
  }
  if (pathname === "/coming-soon") return children;
  if (paused) return <ComingSoonScreen />;
  // Authentication and administration have their own access gates. Customer
  // onboarding must never block an administrator from reopening the website.
  if (/^\/(admin|login|signup|forgot-password)(\/|$)/.test(pathname)) return children;

  return <>
    {children}
    {user && !customPayment && preview !== "authorized" && <ProfileCompletionGate>{null}</ProfileCompletionGate>}
    {!customPayment && preview !== "authorized" && <TripPlanPromptDialog />}
    <FloatingActions />
    <MobileNavigation />
  </>;
}
