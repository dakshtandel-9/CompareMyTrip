"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

// Keeps already-logged-in users off /login and /signup by bouncing them
// home as soon as Firebase resolves an active session.
export default function RequireGuest({ children }: { children: React.ReactNode }) {
  const user = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  if (user) return null;

  return <>{children}</>;
}
