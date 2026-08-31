"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, LoaderCircle, Mail, MessageSquareText, UserRound, Users, X } from "lucide-react";
import PhoneNumberField from "@/components/PhoneNumberField";
import { saveContactEnquiry } from "@/lib/firebase/enquiries";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useUserProfile, type UserProfile } from "@/lib/firebase/useUserProfile";
import type { TravelPackage } from "@/lib/packageData";

export default function QuoteModal({ pkg, initialTravellers, onClose }: { pkg: TravelPackage; initialTravellers: number; onClose: () => void }) {
  const authUser = useAuthUser();
  const profileState = useUserProfile();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);

  return <div className="fixed inset-0 z-[100] grid overflow-y-auto bg-cmt-secondary-900/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="quote-modal-title"><button type="button" aria-label="Close quote form" onClick={onClose} className="fixed inset-0 cursor-default" /><div className="relative m-auto w-full max-w-xl overflow-hidden rounded-cmt-lg bg-white shadow-cmt-xl">
    {profileState.status === "loading" || authUser === undefined ? <div className="grid min-h-80 place-items-center"><LoaderCircle className="size-8 animate-spin text-cmt-primary-700" /></div> : profileState.status === "ready" && authUser ? <QuoteForm key={`${profileState.profile.email}-${profileState.profile.name}-${profileState.profile.phone}-${initialTravellers}`} pkg={pkg} profile={profileState.profile} userId={authUser.uid} initialTravellers={initialTravellers} onClose={onClose} /> : <div className="p-8 text-center"><p className="font-semibold">Please sign in to request a customized quote.</p></div>}
  </div></div>;
}

function QuoteForm({ pkg, profile, userId, initialTravellers, onClose }: { pkg: TravelPackage; profile: UserProfile; userId: string; initialTravellers: number; onClose: () => void }) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone || "+91");
  const [travelDate, setTravelDate] = useState("");
  const [travellers, setTravellers] = useState(String(initialTravellers));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const inputClass = "h-12 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const phoneDigits = phone.replace(/\D/g, "");
    if (name.trim().length < 2) return setError("Enter your full name.");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) return setError("Enter a valid phone number.");
    if (!travelDate) return setError("Choose your travel date.");
    if (Number(travellers) < 1 || Number(travellers) > 20) return setError("Choose between 1 and 20 travellers.");
    try {
      setSending(true);
      await saveContactEnquiry({ name, email: profile.email, phone, destination: pkg.location, departure: travelDate, travellers, message, packageId: pkg.id, packageTitle: pkg.title, pricePerPerson: pkg.price, userId, source: "custom_quote" });
      setSent(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your quote request could not be sent."); }
    finally { setSending(false); }
  };

  if (sent) return <div className="p-8 text-center sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-full bg-cmt-success-100 text-cmt-success-700"><CheckCircle2 className="size-7" /></span><h2 id="quote-modal-title" className="mt-5 font-display text-2xl font-semibold">Quote request sent</h2><p className="mt-2 text-sm leading-6 text-cmt-neutral-600">Our travel team received your request for {pkg.title}.</p><button type="button" onClick={onClose} className="mt-6 h-11 rounded-cmt-control bg-cmt-primary-500 px-6 text-sm font-semibold">Done</button></div>;

  return <><header className="flex items-start gap-3 border-b border-cmt-neutral-200 px-5 py-4 sm:px-6"><span className="grid size-11 shrink-0 place-items-center rounded-cmt-control bg-cmt-primary-500 font-display text-sm font-bold">{pkg.destination.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><h2 id="quote-modal-title" className="font-display text-xl font-semibold">Get customized quotes</h2><p className="mt-0.5 truncate text-xs text-cmt-neutral-500">{pkg.title}</p></div><button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-cmt-control text-cmt-neutral-400 hover:bg-cmt-neutral-100 hover:text-cmt-neutral-900"><X className="size-5" /></button></header>
    <form onSubmit={submit} className="max-h-[calc(100vh-9rem)] overflow-y-auto p-5 sm:p-6" noValidate>
      {error ? <p role="alert" className="mb-5 rounded-cmt-control bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">{error}</p> : null}
      <div className="space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-semibold">Full name *</span><span className="relative block"><UserRound className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" /><input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={`${inputClass} pl-11`} /></span></label>
        <label className="block"><span className="mb-1.5 flex items-center justify-between text-sm font-semibold">Email * <span className="text-xs font-medium text-cmt-success-700">Auto-filled</span></span><span className="relative block"><Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" /><input type="email" readOnly aria-readonly="true" value={profile.email} className={`${inputClass} cursor-not-allowed bg-cmt-neutral-100 pl-11 text-cmt-neutral-500`} /></span></label>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(190px,2fr)]"><PhoneNumberField required compactCountryCode value={phone} onChange={setPhone} /><label className="block min-w-0"><span className="mb-2 block text-sm font-semibold text-cmt-neutral-700">Travel date *</span><span className="relative block min-w-0"><CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" /><input required type="date" min={new Date().toISOString().slice(0, 10)} value={travelDate} onChange={(event) => setTravelDate(event.target.value)} className={`${inputClass} min-w-0 pl-9 pr-2`} /></span></label></div>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold">How many travellers? *</span><span className="relative block"><Users className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" /><input required type="number" min="1" max="20" value={travellers} onChange={(event) => setTravellers(event.target.value)} className={`${inputClass} pl-11`} /></span></label>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold">Message <span className="font-normal text-cmt-neutral-400">(optional)</span></span><span className="relative block"><MessageSquareText className="absolute left-4 top-4 size-4 text-cmt-neutral-400" /><textarea rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Plans, budget or special requests…" className="w-full resize-y rounded-cmt-control border border-cmt-neutral-200 py-3 pl-11 pr-4 text-sm leading-6 outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20" /></span></label></div>
      <button disabled={sending} type="submit" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-cmt-control bg-cmt-primary-500 text-sm font-semibold shadow-cmt-primary hover:bg-cmt-primary-600 disabled:cursor-wait disabled:opacity-60">{sending ? "Sending request…" : "Send quote request"}</button><p className="mt-3 text-center text-xs text-cmt-neutral-500">Your details go only to our verified travel team.</p>
    </form></>;
}
