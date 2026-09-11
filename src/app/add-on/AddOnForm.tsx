"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

import { quoteFileError, sendEnquiryWithQuote } from "@/lib/quoteUpload";
import PhoneNumberField from "@/components/PhoneNumberField";
import { saveContactEnquiry } from "@/lib/firebase/enquiries";
import { useUserProfile } from "@/lib/firebase/useUserProfile";
import {
  composeMessage,
  visibleFields,
  type FieldSpec,
  type ServiceSpec,
  type Values,
} from "./services";

/* ------------------------------------------------------------------ */
/* One form for all three add-ons — Forms & search (§07): 48px height,  */
/* 12px radius, 16px text, focus is a 2px yellow border plus a ring and  */
/* is never suppressed. Every field carries a visible label; the         */
/* placeholder never stands in for one. Errors pair an icon with the     */
/* colour, never colour alone.                                          */
/*                                                                      */
/* The middle of the form is `service.fields`; the contact block, the    */
/* notes box and the submit are the same whichever tab is open. Each     */
/* service keeps its own values, so switching tabs to check something    */
/* and coming back does not empty the form.                              */
/* ------------------------------------------------------------------ */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELD_BASE =
  "w-full rounded-cmt-control border bg-white text-base text-cmt-neutral-900 placeholder:text-cmt-neutral-400 transition-colors duration-150 focus:border-cmt-primary-500 focus:outline-2 focus:-outline-offset-2 focus:outline-cmt-primary-500";

const fieldClass = (invalid: boolean) =>
  `${FIELD_BASE} ${invalid ? "border-cmt-error-500" : "border-cmt-neutral-200 hover:border-cmt-neutral-300"}`;

const LABEL = "block font-body text-sm font-semibold text-cmt-neutral-900";

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs leading-[1.5] text-cmt-error-700">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      {message}
    </p>
  );
}

type Errors = Record<string, string>;

/** Contact details are asked for the same way on every tab, so they are
    validated here rather than in each service's field list. */
function validate(service: ServiceSpec, values: Values): Errors {
  const errors: Errors = {};

  for (const field of visibleFields(service, values)) {
    if (field.required && !values[field.name]?.trim()) {
      errors[field.name] =
        field.kind === "select" ? `Choose ${field.label.toLowerCase()}.` : `Add ${field.label.toLowerCase()}.`;
    }
  }

  if (!values.name?.trim()) errors.name = "Tell us who we should reply to.";

  if (!values.email?.trim()) errors.email = "We need an email address to send options to.";
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Enter a valid email address, like you@example.com.";

  if (!values.phone?.trim()) errors.phone = "Add a phone number so we can reach you quickly.";
  else if (values.phone.replace(/\D/g, "").length < 7) errors.phone = "Enter a phone number we can actually reach.";

  return errors;
}

export default function AddOnForm({ service }: { service: ServiceSpec }) {
  /* Selects open on their first option so nobody has to choose the obvious
     answer; text and date fields open empty. */
  const empty = (): Values => {
    const base: Values = { name: "", email: "", phone: "+91", notes: "" };
    for (const field of service.fields) {
      base[field.name] = field.kind === "select" ? field.options?.[0]?.value ?? "" : "";
    }
    return base;
  };

  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  /* Prefill name / email / phone for a signed-in visitor, filling only the
     fields they have not touched — the profile resolves a moment after
     mount, and must never overwrite typing. */
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
    // applyPrefill is derived from profile; the dep below covers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const set = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const fieldId = (name: string) => `${service.id}-${name}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmissionError("");
    const found = validate(service, values);
    if (errors.quote) found.quote = errors.quote;
    if (quoteFile) { const error = quoteFileError(quoteFile); if (error) found.quote = error; }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move focus to the first problem so keyboard and screen-reader users
      // are not left hunting for it.
      document.getElementById(fieldId(Object.keys(found)[0]))?.focus();
      return;
    }

    try {
      setSubmitting(true);
      const summary = service.summary(values);
      const enquiry = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        destination: summary.destination,
        departure: summary.departure,
        travellers: summary.travellers,
        message: composeMessage(service, values, values.notes ?? ""),
      };
      if (quoteFile) await sendEnquiryWithQuote(quoteFile, enquiry);
      else await saveContactEnquiry(enquiry);
      setQuoteFile(null);
      setSent(true);
      // Keep a signed-in visitor's details in place for the next enquiry.
      setValues(applyPrefill(empty()));
    } catch (cause) {
      setSubmissionError(
        cause instanceof Error ? cause.message : "Your enquiry could not be sent. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col items-start rounded-cmt-md border border-cmt-success-500/40 bg-cmt-success-100/50 p-6 sm:p-8"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-cmt-full bg-white">
          <CheckCircle2 className="h-6 w-6 text-cmt-success-700" strokeWidth={2} aria-hidden="true" />
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold leading-[1.2] text-cmt-neutral-900">
          Enquiry sent.
        </h3>
        <p className="mt-2 max-w-[46ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-700 sm:text-base">
          {service.sentNote} Keep an eye on your email and your phone.
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

  const renderField = (field: FieldSpec) => {
    const id = fieldId(field.name);
    const error = errors[field.name];
    const hintId = field.hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

    return (
      <div key={field.name} className={field.wide ? "sm:col-span-2" : undefined}>
        <label htmlFor={id} className={LABEL}>
          {field.label}{" "}
          {field.required ? (
            <span className="text-cmt-error-500">*</span>
          ) : (
            <span className="font-normal text-cmt-neutral-500">(optional)</span>
          )}
        </label>

        {field.kind === "select" ? (
          <select
            id={id}
            name={field.name}
            value={values[field.name] ?? ""}
            onChange={(event) => set(field.name, event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`mt-2 h-12 appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat px-4 pr-11 ${fieldClass(Boolean(error))}`}
            style={{ backgroundImage: SELECT_CHEVRON }}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            name={field.name}
            type={field.kind === "date" ? "date" : "text"}
            placeholder={field.placeholder}
            value={values[field.name] ?? ""}
            onChange={(event) => set(field.name, event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`mt-2 h-12 px-4 ${fieldClass(Boolean(error))}`}
          />
        )}

        <FieldError id={`${id}-error`} message={error} />
        {field.hint && !error ? (
          <p id={hintId} className="mt-1.5 text-xs leading-[1.5] text-cmt-neutral-500">
            {field.hint}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <fieldset disabled={submitting} className="contents">
      {visibleFields(service, values).map(renderField)}

      {/* Contact block — the same three questions on every tab. */}
      <div className="sm:col-span-2">
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-cmt-neutral-500">
            Where we reply
          </span>
          <span className="h-px flex-1 bg-cmt-neutral-200" aria-hidden="true" />
        </div>
      </div>

      <div>
        <label htmlFor={fieldId("name")} className={LABEL}>
          Full name <span className="text-cmt-error-500">*</span>
        </label>
        <input
          id={fieldId("name")}
          name="name"
          autoComplete="name"
          placeholder="Priya Sharma"
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${fieldId("name")}-error` : undefined}
          className={`mt-2 h-12 px-4 ${fieldClass(Boolean(errors.name))}`}
        />
        <FieldError id={`${fieldId("name")}-error`} message={errors.name} />
      </div>

      <div>
        <label htmlFor={fieldId("email")} className={LABEL}>
          Email <span className="text-cmt-error-500">*</span>
        </label>
        <input
          id={fieldId("email")}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(event) => set("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${fieldId("email")}-error` : undefined}
          className={`mt-2 h-12 px-4 ${fieldClass(Boolean(errors.email))}`}
        />
        <FieldError id={`${fieldId("email")}-error`} message={errors.email} />
      </div>

      <div>
        <PhoneNumberField
          id={fieldId("phone")}
          value={values.phone}
          onChange={(phone) => set("phone", phone)}
          label={<>Phone <span className="text-cmt-error-500">*</span></>}
          required
          invalid={Boolean(errors.phone)}
          describedBy={errors.phone ? `${fieldId("phone")}-error` : undefined}
        />
        <FieldError id={`${fieldId("phone")}-error`} message={errors.phone} />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={fieldId("notes")} className={LABEL}>
          {service.notesLabel} <span className="font-normal text-cmt-neutral-500">(optional)</span>
        </label>
        <textarea
          id={fieldId("notes")}
          name="notes"
          rows={4}
          placeholder={service.notesPlaceholder}
          value={values.notes}
          onChange={(event) => set("notes", event.target.value)}
          className={`mt-2 min-h-[120px] resize-y px-4 py-3 leading-[1.6] ${fieldClass(false)}`}
        />
      </div>

      <div className="rounded-cmt-md border border-dashed border-cmt-neutral-300 bg-cmt-neutral-50 p-5 sm:col-span-2">
        <label htmlFor={fieldId("quote")} className={LABEL}>Already have a quote? Attach your PDF <span className="font-normal text-cmt-neutral-500">(optional)</span></label>
        <p id={`${fieldId("quote")}-hint`} className="mt-2 text-sm leading-6 text-cmt-neutral-600">PDF only, maximum 10 MB. Your attachment expires after 72 hours and is automatically deleted. Your enquiry details stay with our travel desk.</p>
        <input ref={fileRef} id={fieldId("quote")} name="quote" type="file" accept=".pdf,application/pdf" aria-invalid={Boolean(errors.quote)} aria-describedby={`${fieldId("quote")}-hint${errors.quote ? ` ${fieldId("quote")}-error` : ""}`}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            const error = file ? quoteFileError(file) : "";
            setErrors(current => ({ ...current, quote: error }));
            setQuoteFile(error ? null : file);
            if (error) event.target.value = "";
          }}
          className="mt-3 block w-full min-w-0 rounded-lg text-sm text-cmt-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-3 file:font-semibold file:text-cmt-neutral-900 focus-visible:outline-2 focus-visible:outline-cmt-primary-500" />
        <FieldError id={`${fieldId("quote")}-error`} message={errors.quote} />
        {(quoteFile || errors.quote) && <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-cmt-neutral-600">{quoteFile && <span className="break-all">{quoteFile.name} · {(quoteFile.size / 1_000_000).toFixed(2)} MB · uploaded when you send</span>}<button type="button" onClick={() => { setQuoteFile(null); setErrors(current => { const next = { ...current }; delete next.quote; return next; }); if (fileRef.current) fileRef.current.value = ""; }} className="min-h-9 rounded px-2 font-semibold underline focus-visible:outline-2 focus-visible:outline-cmt-primary-500">Remove PDF</button></div>}
      </div>

      <div className="sm:col-span-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
        {submissionError ? (
          <p
            role="alert"
            className="mb-3 w-full rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700 sm:basis-full"
          >
            {submissionError}
          </p>
        ) : null}
        {/* Large primary (§06): 18px text, h52, radius 12. The only yellow
            button on the page — a second one is a defect. */}
        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-cmt-control bg-cmt-primary-500 px-8 font-body text-[18px] font-semibold tracking-[0.005em] text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {submitting ? (quoteFile ? "Uploading and sending…" : "Sending…") : `Send ${service.label.toLowerCase()} enquiry`}
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
      </fieldset>
    </form>
  );
}
