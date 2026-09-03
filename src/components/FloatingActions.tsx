"use client";

import { usePathname } from "next/navigation";

import CompareFloatingButton from "@/components/CompareFloatingButton";

/* ------------------------------------------------------------------ */
/* The corner stack.                                                    */
/*                                                                       */
/* Mounted once in the root layout, so it rides along on every page       */
/* rather than being wired into each one, and pinned bottom-right where   */
/* it sits clear of the header and of the footer's links. Just the        */
/* shortlist now — WhatsApp moved up to the header's offer strip, where   */
/* it sits beside the phone number rather than covering the page.         */
/*                                                                       */
/* z-40 keeps the stack under the header's full-screen mobile menu        */
/* (z-[100]) and under the admin shell's drawer (z-50), so an open        */
/* overlay covers it instead of being punched through.                    */
/* ------------------------------------------------------------------ */

/* Routes that own the whole screen and take no passengers. */
const HIDDEN_PREFIXES = ["/login", "/signup", "/admin"];

export default function FloatingActions() {
  const pathname = usePathname();

  if (
    !pathname ||
    HIDDEN_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return null;
  }

  /* A button back to the page you are already on is no button at all, and
     the shortlist is the only thing left in the stack. */
  if (pathname === "/compare") return null;

  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-center gap-3 sm:bottom-6 sm:right-6">
      <CompareFloatingButton />
    </div>
  );
}
