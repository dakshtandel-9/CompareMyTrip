import { Phone } from "lucide-react";

const SUPPORT_PHONES = [
  { label: "Help line", number: "080 6927 7012", href: "tel:+918069277012" },
  { label: "Direct Support", number: "+91 95359 76868", href: "tel:+919535976868" },
  { label: "Weekend Treks", number: "+91 63627 80898", href: "tel:+916362780898" },
];

export default function SupportPhones({ compact = false, footerRow = false }: { compact?: boolean; footerRow?: boolean }) {
  return (
    <ul className={footerRow ? "grid gap-4 lg:grid-cols-3 lg:gap-5" : compact ? "mt-6 space-y-4" : "mt-6 grid gap-4 sm:grid-cols-3"}>
      {SUPPORT_PHONES.map((phone) => (
        <li key={phone.href}>
          <a
            href={phone.href}
            className={`flex items-start gap-3 rounded-cmt-md text-cmt-neutral-700 transition-colors hover:text-cmt-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 ${compact ? "" : "h-full border border-cmt-neutral-200 bg-cmt-neutral-50 p-5"}`}
          >
            <Phone className="mt-1 h-4 w-4 shrink-0 text-cmt-primary-700" aria-hidden="true" />
            <span className={footerRow ? "min-w-0" : undefined}>
              <span className="block text-xs font-semibold text-cmt-neutral-500">{phone.label}</span>
              <span className={`mt-1 block text-sm ${compact ? "font-semibold" : "font-medium"} ${footerRow ? "whitespace-nowrap xl:text-base" : ""}`}>{phone.number}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
