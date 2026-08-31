"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Phone } from "lucide-react";

const COUNTRY_CODES = [
  ["+91", "India", "🇮🇳"],
  ["+1", "United States / Canada", "🇺🇸"],
  ["+44", "United Kingdom", "🇬🇧"],
  ["+61", "Australia", "🇦🇺"],
  ["+971", "United Arab Emirates", "🇦🇪"],
  ["+65", "Singapore", "🇸🇬"],
  ["+60", "Malaysia", "🇲🇾"],
  ["+66", "Thailand", "🇹🇭"],
  ["+62", "Indonesia", "🇮🇩"],
  ["+84", "Vietnam", "🇻🇳"],
  ["+94", "Sri Lanka", "🇱🇰"],
  ["+960", "Maldives", "🇲🇻"],
  ["+977", "Nepal", "🇳🇵"],
  ["+880", "Bangladesh", "🇧🇩"],
  ["+92", "Pakistan", "🇵🇰"],
  ["+974", "Qatar", "🇶🇦"],
  ["+966", "Saudi Arabia", "🇸🇦"],
  ["+968", "Oman", "🇴🇲"],
  ["+965", "Kuwait", "🇰🇼"],
  ["+973", "Bahrain", "🇧🇭"],
  ["+49", "Germany", "🇩🇪"],
  ["+33", "France", "🇫🇷"],
  ["+39", "Italy", "🇮🇹"],
  ["+34", "Spain", "🇪🇸"],
  ["+31", "Netherlands", "🇳🇱"],
  ["+41", "Switzerland", "🇨🇭"],
  ["+81", "Japan", "🇯🇵"],
  ["+82", "South Korea", "🇰🇷"],
  ["+86", "China", "🇨🇳"],
  ["+64", "New Zealand", "🇳🇿"],
] as const;

const SORTED_CODES = [...COUNTRY_CODES].sort((a, b) => b[0].length - a[0].length);

function splitPhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  if (!compact || compact === "+") {
    return { countryCode: compact, number: "" };
  }
  if (!compact.startsWith("+")) {
    return { countryCode: "", number: compact.replace(/\D/g, "") };
  }
  const knownCode = SORTED_CODES.find(([code]) => compact.startsWith(code));
  if (knownCode) return { countryCode: knownCode[0], number: compact.slice(knownCode[0].length).replace(/\D/g, "") };
  const match = compact.match(/^(\+\d{1,3})(.*)$/);
  return { countryCode: match?.[1] ?? "+91", number: (match?.[2] ?? "").replace(/\D/g, "") };
}

export default function PhoneNumberField({
  value,
  onChange,
  label = "Phone number",
  required = false,
  id,
  invalid = false,
  describedBy,
  compactCountryCode = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  required?: boolean;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  compactCountryCode?: boolean;
}) {
  const generatedId = useId();
  const numberId = id ?? `${generatedId}-number`;
  const codeId = `${numberId}-code`;
  const listId = `${generatedId}-country-codes`;
  const initialPhone = splitPhone(value);
  const [countryCode, setCountryCode] = useState(initialPhone.countryCode);
  const [number, setNumber] = useState(initialPhone.number);
  const lastEmittedValue = useRef<string | null>(null);
  const selectedFlag = COUNTRY_CODES.find(([code]) => code === countryCode)?.[2] ?? "🌐";

  useEffect(() => {
    if (value === lastEmittedValue.current) return;
    const nextPhone = splitPhone(value);
    setCountryCode(nextPhone.countryCode);
    setNumber(nextPhone.number);
  }, [value]);

  function emitPhone(nextCode: string, nextNumber: string) {
    const nextValue = `${nextCode}${nextNumber}`;
    lastEmittedValue.current = nextValue;
    onChange(nextValue);
  }

  function updateCode(nextValue: string) {
    const digits = nextValue.replace(/\D/g, "").slice(0, 3);
    const nextCode = digits ? `+${digits}` : "";
    setCountryCode(nextCode);
    emitPhone(nextCode, number);
  }

  function updateNumber(nextValue: string) {
    const nextNumber = nextValue.replace(/\D/g, "").slice(0, 15);
    setNumber(nextNumber);
    emitPhone(countryCode, nextNumber);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={numberId} className="text-[14px] font-semibold text-cmt-neutral-700">
        {label}
      </label>
      <div className={`flex h-12 overflow-hidden rounded-cmt-control border bg-white transition-colors focus-within:border-2 focus-within:border-cmt-primary-500 focus-within:shadow-[var(--cmt-focus-ring)] ${invalid ? "border-cmt-error-500" : "border-cmt-neutral-200 hover:border-cmt-neutral-300"}`}>
        <span className={`relative shrink-0 border-r border-cmt-neutral-200 bg-cmt-neutral-50 ${compactCountryCode ? "w-[94px]" : "w-[118px]"}`}>
          <label className="sr-only" htmlFor={codeId}>Country code</label>
          <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-lg ${compactCountryCode ? "left-2" : "left-3"}`} aria-hidden="true">
            {selectedFlag}
          </span>
          <input
            id={codeId}
            list={listId}
            inputMode="tel"
            autoComplete="tel-country-code"
            aria-label="Country code"
            value={countryCode}
            onChange={(event) => updateCode(event.target.value)}
            className={`h-full w-full border-0 bg-transparent pr-1 text-left text-[15px] font-semibold text-cmt-neutral-900 outline-none placeholder:text-cmt-neutral-500 ${compactCountryCode ? "pl-8" : "pl-10"}`}
          />
        </span>
        <datalist id={listId}>
          {COUNTRY_CODES.map(([code, country, flag]) => <option key={`${code}-${country}`} value={code}>{flag} {country}</option>)}
        </datalist>
        <span className="relative min-w-0 flex-1">
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-cmt-neutral-500" aria-hidden="true" />
          <input
            id={numberId}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required={required}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            value={number}
            onChange={(event) => updateNumber(event.target.value)}
            placeholder="98765 43210"
            className="h-full w-full border-0 bg-white pl-10 pr-3 text-[16px] text-cmt-neutral-900 outline-none placeholder:text-cmt-neutral-400"
          />
        </span>
      </div>
    </div>
  );
}
