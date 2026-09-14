"use client";

import type { ReactNode } from "react";
import { ArrowRight, Inbox, LoaderCircle, Mail, Phone, Search } from "lucide-react";

export function OperationsHeader({ eyebrow, title, description, action, metrics }: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  metrics: { label: string; value: string | number; hint: string; attention?: boolean }[];
}) {
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wide text-emerald-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </header>
    <dl className="grid gap-3 sm:grid-cols-3">
      {metrics.map(metric => <div key={metric.label} className={`rounded-2xl border p-5 ${metric.attention ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white"}`}>
        <dt className="text-sm font-medium text-slate-600">{metric.label}</dt>
        <dd className="mt-2"><span className="text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</span><p className="mt-1 text-xs leading-5 text-slate-500">{metric.hint}</p></dd>
      </div>)}
    </dl>
  </div>;
}

export function WorkflowGuide({ steps }: { steps: string[] }) {
  return <div className="my-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600" aria-label="How to use this page">
    <span className="mr-1 font-semibold text-slate-900">How it works</span>
    {steps.map((step, index) => <span className="inline-flex items-center gap-3" key={step}>
      {index > 0 && <ArrowRight className="size-3.5 text-slate-300" aria-hidden="true" />}
      <span><span className="mr-1.5 font-semibold text-emerald-700">{index + 1}.</span>{step}</span>
    </span>)}
  </div>;
}

export function InboxSearch({ value, onChange, placeholder = "Search name, email, phone or destination", label = "Search records" }: {
  value: string; onChange: (value: string) => void; placeholder?: string; label?: string;
}) {
  return <label className="relative block w-full sm:max-w-sm">
    <span className="sr-only">{label}</span>
    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    <input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
  </label>;
}

export function InboxFilters<Value extends string>({ value, onChange, options }: {
  value: Value; onChange: (value: Value) => void; options: { value: Value; label: string; count: number }[];
}) {
  return <div className="flex flex-wrap gap-2" aria-label="Filter records">
    {options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}
      className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${value === option.value ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
      {option.label}<span className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs tabular-nums text-slate-500">{option.count}</span>
    </button>)}
  </div>;
}

export function InboxState({ loading, empty, title, description, onReset }: {
  loading: boolean; empty: boolean; title: string; description: string; onReset?: () => void;
}) {
  if (loading) return <div role="status" className="flex items-center justify-center gap-3 px-5 py-16 text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin text-emerald-600" aria-hidden="true" />Loading records…</div>;
  if (!empty) return null;
  return <div className="px-5 py-14 text-center">
    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-50"><Inbox className="size-6 text-slate-400" aria-hidden="true" /></span>
    <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    {onReset && <button type="button" onClick={onReset} className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear filters</button>}
  </div>;
}

export function ContactLinks({ email, phone }: { email: string; phone: string }) {
  return <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
    {phone && <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-emerald-700"><Phone className="size-3.5 shrink-0" aria-hidden="true" />{phone}</a>}
    {email && <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-1.5 break-all hover:text-emerald-700"><Mail className="size-3.5 shrink-0" aria-hidden="true" />{email}</a>}
    {!phone && !email && <span>No contact details provided</span>}
  </div>;
}
