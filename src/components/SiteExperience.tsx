"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { bypassComingSoon } from "@/lib/comingSoon";
import { useSiteContentState } from "@/lib/useSiteContent";
import ComingSoonScreen from "./ComingSoonScreen";
import FloatingActions from "./FloatingActions";
import MobileNavigation from "./MobileNavigation";
import ProfileCompletionGate from "./ProfileCompletionGate";
import TripPlanPromptDialog from "./TripPlanPromptDialog";
import WebsiteLoader from "./WebsiteLoader";

export default function SiteExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { content, loading } = useSiteContentState();
  const paused = !loading && content.comingSoon.enabled && !bypassComingSoon(pathname);
  const customPayment = pathname === "/pay" || pathname === "/pay/status";

  // Middleware handles fresh requests; this covers already open pages and
  // routes held in the browser's client navigation cache.
  useEffect(() => {
    if (paused) router.replace("/coming-soon");
  }, [paused, router]);

  if (pathname === "/coming-soon") return children;
  if (paused) return <ComingSoonScreen />;

  return <>
    {!customPayment && <WebsiteLoader autoDismiss />}
    {customPayment ? children : <ProfileCompletionGate>{children}</ProfileCompletionGate>}
    {!customPayment && <TripPlanPromptDialog />}
    <FloatingActions />
    <MobileNavigation />
  </>;
}
