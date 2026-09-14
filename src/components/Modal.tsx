"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { lockPageScroll } from "@/lib/lockPageScroll";

/** Native modality keeps the background inert, including for screen readers. */
export default function Modal({ children, onClose, className, label, labelledBy }: {
  children: ReactNode;
  onClose: () => void;
  className: string;
  label?: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = lockPageScroll();
    dialog.showModal();
    (dialog.querySelector<HTMLElement>("[data-modal-initial-focus]") ?? dialog).focus();
    const containTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog.matches(":modal")) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, summary, [tabindex]',
      )).filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0);
      const index = controls.indexOf(document.activeElement as HTMLElement);
      if (!controls.length || index < 0 || (event.shiftKey ? index === 0 : index === controls.length - 1)) {
        event.preventDefault();
        (event.shiftKey ? controls.at(-1) ?? dialog : controls[0] ?? dialog).focus();
      }
    };
    // Some browsers send focus to browser chrome at a native dialog's edge.
    // Keep explicit Tab wrapping while retaining native background inertness.
    document.addEventListener("keydown", containTab);
    return () => {
      document.removeEventListener("keydown", containTab);
      dialog.close();
      unlock();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={ref} tabIndex={-1} aria-label={label} aria-labelledby={labelledBy}
    className={`m-0 h-dvh max-h-none w-screen max-w-none border-0 text-inherit ${className}`}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    {children}
  </dialog>;
}
