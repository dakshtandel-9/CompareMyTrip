"use client";

import { useEffect, useState } from "react";
import { subscribeToContactEnquiries, type ContactEnquiry } from "@/lib/firebase/enquiries";
import { subscribeToPopupLeads, type PopupLead } from "@/lib/firebase/popupLeads";
import { subscribeToTrips, type Trip } from "@/lib/firebase/trips";

type Records<T> = { records: T[]; loading: boolean; error: string };
function useRecords<T>(subscribe: (next: (records: T[]) => void, error: (message: string) => void) => () => void) {
  const [state, setState] = useState<Records<T>>({ records: [], loading: true, error: "" });
  useEffect(() => {
    let stop: (() => void) | undefined;
    try {
      stop = subscribe(
        (records) => setState({ records, loading: false, error: "" }),
        (error) => setState({ records: [], loading: false, error }),
      );
    } catch {
      queueMicrotask(() => setState({ records: [], loading: false, error: "Could not connect. Open this section to try again." }));
    }
    return () => stop?.();
  }, [subscribe]);
  return state;
}
export function useAdminOverview() {
  const enquiries = useRecords<ContactEnquiry>(subscribeToContactEnquiries);
  const leads = useRecords<PopupLead>(subscribeToPopupLeads);
  const trips = useRecords<Trip>(subscribeToTrips);
  return { enquiries, leads, trips };
}
