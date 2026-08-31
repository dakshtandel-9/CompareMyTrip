"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

export default function AdminAccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthUser();
  const [authorizedUid, setAuthorizedUid] = useState<string | null>(null);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.replace("/404");
      return;
    }

    let active = true;
    getDoc(doc(getFirebaseDb(), "admins", user.uid))
      .then((adminDocument) => {
        if (!active) return;
        if (adminDocument.exists()) setAuthorizedUid(user.uid);
        else router.replace("/404");
      })
      .catch(() => {
        if (active) router.replace("/404");
      });

    return () => {
      active = false;
    };
  }, [router, user]);

  if (!user || authorizedUid !== user.uid) {
    return (
      <main className="grid min-h-screen place-items-center bg-cmt-neutral-50" aria-busy="true">
        <div className="text-center">
          <span className="mx-auto block size-8 animate-spin rounded-cmt-full border-2 border-cmt-neutral-200 border-t-cmt-primary-500" />
          <p className="mt-3 text-sm text-cmt-neutral-500">Loading…</p>
        </div>
      </main>
    );
  }

  return children;
}
