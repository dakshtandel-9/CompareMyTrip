"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

import PhoneNumberField from "@/components/PhoneNumberField";
import { saveContactEnquiry } from "@/lib/firebase/enquiries";
import { useUserProfile } from "@/lib/firebase/useUserProfile";

/* ------------------------------------------------------------------ */
/* Enquiry form — Forms & search (§07): 48px height, 12px radius, 16px  */
/* text, focus is a 2px yellow border plus a ring and is never          */
/* suppressed. Every field carries a visible label; the placeholder is  */
/* never a substitute for one. Errors pair an icon with the colour,     */
/* never colour alone.                                                  */
/* ------------------------------------------------------------------ */

type FieldName =
  | "name"
  | "email"
  | "phone"
  | "destination"
  | "departure"
  | "travellers"
  | "message";

type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

const EMPTY: Values = {
  name: "",
  email: "",
  phone: "+91",
  destination: "",
  departure: "",
  travellers: "",
  message: "",
};

/* Deliberately permissive — the real check is the reply landing. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) {
    errors.name = "Tell us who we should reply to.";
  }
  if (!values.email.trim()) {
    errors.email = "We need an email address to send options to.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address, like you@example.com.";
  }
  if (!values.phone.trim()) {
    errors.phone = "Add a phone number so we can reach you quickly.";
  } else if (values.phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Enter a phone number we can actually reach.";
  }
  if (!values.message.trim()) {
    errors.message = "Tell us a little about the trip you have in mind.";
  }
  return errors;
}

const FIELD_BASE =
  "w-full rounded-cmt-control border bg-white text-base text-cmt-neutral-900 placeholder:text-cmt-neutral-400 transition-colors duration-150 focus:border-cmt-primary-500 focus:outline-2 focus:-outline-offset-2 focus:outline-cmt-primary-500";

const fieldClass = (invalid: boolean) =>
  `${FIELD_BASE} ${
    invalid
      ? "border-cmt-error-500"
      : "border-cmt-neutral-200 hover:border-cmt-neutral-300"
  }`;

const LABEL =
  "block font-body text-sm font-semibold text-cmt-neutral-900";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      className="mt-1.5 flex items-start gap-1.5 text-xs leading-[1.5] text-cmt-error-700"
    >
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      {message}
    </p>
  );
}

export default function EnquiryForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  // Prefill name / email / phone for a signed-in user. We only fill fields the
  // visitor hasn't touched, so typing is never overwritten when the profile
  // resolves a moment after mount.
  const { profile } = useUserProfile();
  const applyPrefill = (base: Values): Values =>
    profile
      ? {
          ...base,
          name: base.name || profile.name,
          email: base.email || profile.email,
          phone: base.phone === "+91" ? profile.phone || base.phone : base.phone,
        }
      : base;
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !profile) return;
    prefilled.current = true;
    setValues(applyPrefill);
    // applyPrefill is derived from profile; deps below cover it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const update = (field: FieldName) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError("");
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move focus to the first problem so keyboard and screen-reader users
      // are not left hunting for it.
      const first = Object.keys(found)[0];
      document.getElementById(`enquiry-${first}`)?.focus();
      return;
    }

    try {
      setSubmitting(true);
      await saveContactEnquiry(values);
      setSent(true);
      // Reset the form, but keep the signed-in user's details filled in for the next enquiry.
      setValues(applyPrefill(EMPTY));
    } catch (cause) {
      setSubmissionError(cause instanceof Error ? cause.message : "Your enquiry could not be sent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-start justify-center rounded-cmt-md border border-cmt-success-500/40 bg-cmt-success-100/50 p-6 sm:p-8"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-cmt-full bg-white">
          <CheckCircle2 className="h-6 w-6 text-cmt-success-700" strokeWidth={2} aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold leading-[1.2] text-cmt-neutral-900">
          Enquiry sent.
        </h2>
        <p className="mt-2 max-w-[46ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-700 sm:text-base">
          Thanks — your enquiry is with our travel desk. We&apos;ll come back to
          you with options that match what you asked for.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-300 bg-white px-5 font-body text-sm font-semibold text-cmt-neutral-900 transition-colors duration-150 hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="enquiry-name" className={LABEL}>
          Full name <span className="text-cmt-error-500">*</span>
        </label>
        <input
          id="enquiry-name"
          name="name"
          aria-required="true"
          autoComplete="name"
          placeholder="Priya Sharma"
          value={values.name}
          onChange={update("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "enquiry-name-error" : undefined}
          className={`mt-2 h-12 px-4 ${fieldClass(Boolean(errors.name))}`}
        />
        <FieldError id="enquiry-name-error" message={errors.name} />
      </div>

      <div>
        <label htmlFor="enquiry-email" className={LABEL}>
          Email <span className="text-cmt-error-500">*</span>
        </label>
        <input
          id="enquiry-email"
          name="email"
          aria-required="true"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={update("email")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "enquiry-email-error" : undefined}
          className={`mt-2 h-12 px-4 ${fieldClass(Boolean(errors.email))}`}
        />
        <FieldError id="enquiry-email-error" message={errors.email} />
      </div>

      <div>
        <PhoneNumberField
          id="enquiry-phone"
          value={values.phone}
          onChange={(phone) => {
            setValues((current) => ({ ...current, phone }));
            setErrors((current) => {
              if (!current.phone) return current;
              const next = { ...current };
              delete next.phone;
              return next;
            });
          }}
          label={<>Phone <span className="text-cmt-error-500">*</span></>}
          required
          invalid={Boolean(errors.phone)}
          describedBy={errors.phone ? "enquiry-phone-error" : undefined}
        />
        <FieldError id="enquiry-phone-error" message={errors.phone} />
      </div>

      <div>
        <label htmlFor="enquiry-destination" className={LABEL}>
          Destination <span className="font-normal text-cmt-neutral-500">(optional)</span>
        </label>
        <input
          id="enquiry-destination"
          name="destination"
          placeholder="Ladakh, Kerala, Bali…"
          value={values.destination}
          onChange={update("destination")}
          className={`mt-2 h-12 px-4 ${fieldClass(false)}`}
        />
      </div>

      <div>
        <label htmlFor="enquiry-departure" className={LABEL}>
          Approximate departure{" "}
          <span className="font-normal text-cmt-neutral-500">(optional)</span>
        </label>
        <input
          id="enquiry-departure"
          name="departure"
          type="date"
          value={values.departure}
          onChange={update("departure")}
          className={`mt-2 h-12 px-4 ${fieldClass(false)}`}
        />
      </div>

      <div>
        <label htmlFor="enquiry-travellers" className={LABEL}>
          Travellers <span className="font-normal text-cmt-neutral-500">(optional)</span>
        </label>
        <select
          id="enquiry-travellers"
          name="travellers"
          value={values.travellers}
          onChange={update("travellers")}
          className={`mt-2 h-12 appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat px-4 pr-11 ${fieldClass(false)}`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
        >
          <option value="">Select a group size</option>
          <option value="1">Just me</option>
          <option value="2">2 travellers</option>
          <option value="3-4">3–4 travellers</option>
          <option value="5-8">5–8 travellers</option>
          <option value="9+">9 or more</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="enquiry-message" className={LABEL}>
          What are you planning? <span className="text-cmt-error-500">*</span>
        </label>
        <textarea
          id="enquiry-message"
          name="message"
          aria-required="true"
          rows={5}
          placeholder="Dates you have in mind, the kind of pace you want, anything the trip has to include."
          value={values.message}
          onChange={update("message")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "enquiry-message-error" : undefined}
          className={`mt-2 min-h-[140px] resize-y px-4 py-3 leading-[1.6] ${fieldClass(Boolean(errors.message))}`}
        />
        <FieldError id="enquiry-message-error" message={errors.message} />
      </div>

      <div className="sm:col-span-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
        {submissionError ? <p role="alert" className="mb-3 w-full rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700 sm:basis-full">{submissionError}</p> : null}
        {/* Large primary (§06): 18px text, h52, radius 12. The only yellow
            button on the page — a second one is a defect. */}
        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-cmt-control bg-cmt-primary-500 px-8 font-body text-[18px] font-semibold tracking-[0.005em] text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Sending…" : "Send Enquiry"}
          <ArrowRight
            className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </button>

        <p className="mt-4 text-xs leading-[1.5] text-cmt-neutral-500 sm:mt-0 sm:max-w-[32ch] sm:text-right">
          We use these details only to answer your enquiry. Fields marked{" "}
          <span className="text-cmt-error-500">*</span> are required.
        </p>
      </div>
    </form>
  );
}
