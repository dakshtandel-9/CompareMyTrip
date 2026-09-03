"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lock, Mail, User, X } from "lucide-react";

import TextField from "@/app/(auth)/_components/TextField";
import Checkbox from "@/app/(auth)/_components/Checkbox";
import Button from "@/app/(auth)/_components/Button";
import Divider from "@/app/(auth)/_components/Divider";
import GoogleIcon from "@/app/(auth)/_components/GoogleIcon";
import AuthAlert from "@/app/(auth)/_components/AuthAlert";
import PhoneNumberField from "@/components/PhoneNumberField";
import { getAuthErrorMessage, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { Glyph } from "@/lib/adminIcons";
import { useSiteContent } from "@/lib/useSiteContent";

/* ------------------------------------------------------------------ */
/* Signed-out prompt (design.md §Modal: 24px radius, 560px, 32px pad,   */
/* shadow-xl, rgba(15,23,42,0.48) backdrop, close icon top-right,       */
/* panel opacity + scale(0.98)→1 over 400ms on --ease-emphasis).        */
/*                                                                      */
/* It reuses the auth pages' own field, button and alert components and */
/* their sign-in functions rather than restating them, so the popup and */
/* /login stay in step; neither page is modified. Unlike the pages it   */
/* does not navigate on success — a visitor prompted mid-browse should  */
/* land back where they were, now signed in.                            */
/*                                                                      */
/* Mounted once in the root layout, so its timer is armed by a document */
/* load and not by client-side navigation: it appears 5s after a hard   */
/* load or refresh, and a dismissal lasts until the next one. Nothing   */
/* is written to storage — that is what makes every refresh re-arm it.  */
/* ------------------------------------------------------------------ */

const PROMPT_DELAY_MS = 12000;

/* Routes where the prompt would be absurd or in the way: the auth pages
   themselves, checkout (already a conversion flow) and the CRM. */
const SUPPRESSED_PREFIXES = ["/login", "/signup", "/forgot-password", "/admin", "/checkout"];


type Tab = "login" | "signup";

export default function AuthPromptDialog() {
  const user = useAuthUser();
  const pathname = usePathname();
  /* Copy, icons and the dismiss label only — the tabs, fields and Firebase
     calls below are code, not content. */
  const { auth } = useSiteContent();
  const copy = auth.prompt;
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [delayElapsed, setDelayElapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [requested, setRequested] = useState(false);
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+91");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const busy = isSubmitting || isGoogleSubmitting;

  /* One timer per document load. It only marks the delay as spent — whether
     to show is decided below, so an auth check that resolves slower than
     five seconds still gets the right answer rather than a flash. */
  useEffect(() => {
    const timer = window.setTimeout(() => setDelayElapsed(true), PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  /* Product actions can request this same branded dialog immediately. This
     keeps one authentication experience across the site instead of mounting
     a second, visually different login form inside package pages. */
  useEffect(() => {
    const handleRequest = () => {
      setEntered(false);
      setDismissed(false);
      setRequested(true);
    };
    window.addEventListener("cmt:open-auth-prompt", handleRequest);
    return () => window.removeEventListener("cmt:open-auth-prompt", handleRequest);
  }, []);

  const suppressedRoute = SUPPRESSED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  /* `undefined` means Firebase has not answered yet — only an explicit
     `null` is a signed-out visitor. */
  /* Turning the prompt off in the CRM stops it appearing on its own, but a
     component that explicitly asks for it (the "Log in" button) still gets
     it — otherwise the switch would break sign-in, not just the nudge. */
  const promptAllowed = auth.enabled && copy.enabled;
  const open =
    (requested || (delayElapsed && !dismissed && promptAllowed)) &&
    !suppressedRoute &&
    user === null;

  /* showModal() is what gives the focus trap, the inert background and Esc
     without hand-rolling any of them. The panel is painted at scale(0.98)
     first, then the next frame flips it to its resting state so the
     transition has two values to move between. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    if (!dialog.open) dialog.showModal();
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const close = (notifyRequester = true) => {
    setRequested(false);
    setDismissed(true);
    setEntered(false);
    if (notifyRequester) window.dispatchEvent(new Event("cmt:auth-prompt-dismissed"));
  };

  const completeAuthentication = () => {
    window.dispatchEvent(new Event("cmt:auth-prompt-complete"));
    close(false);
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setFormError("");
  };

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!email || !password) return setFormError("Please enter your email and password.");

    setIsSubmitting(true);
    try {
      await signInWithEmail({ email, password, remember: rememberMe });
      completeAuthentication();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!fullName || !email || !phone || !password) return setFormError("Please fill in every field.");
    if (phone.replace(/\D/g, "").length < 8) return setFormError("Please enter a valid phone number.");
    if (password.length < 8) return setFormError("Password must be at least 8 characters.");
    if (!agreedToTerms) return setFormError("Please accept the Terms and Privacy Policy to continue.");

    setIsSubmitting(true);
    try {
      await signUpWithEmail({ name: fullName, email, phone, password });
      completeAuthentication();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setFormError("");
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      completeAuthentication();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-prompt-title"
      onClose={() => close()}
      /* A click that lands on the element itself is a click on the backdrop,
         since the panel below covers the whole dialog box. */
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[560px] overflow-visible rounded-cmt-lg border-0 bg-transparent p-0 backdrop:bg-[rgba(15,23,42,0.48)]"
    >
      <div
        className={`relative overflow-hidden rounded-cmt-lg bg-cmt-white font-body text-cmt-neutral-900 shadow-cmt-xl transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
          entered ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => close()}
          aria-label="Close and keep browsing"
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-cmt-full text-cmt-neutral-500 transition-colors duration-200 hover:bg-cmt-neutral-100 hover:text-cmt-neutral-900 focus-visible:shadow-[var(--cmt-focus-ring)] focus-visible:outline-none"
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>

        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto px-6 py-7 sm:px-8 sm:py-8">
          <Image
            src="/logo.png"
            alt="CompareMyTrip"
            width={1400}
            height={167}
            className="h-6 w-auto"
          />

          <h2
            id="auth-prompt-title"
            className="mt-5 max-w-[22ch] font-display text-[24px] font-bold leading-[1.2] tracking-[-0.005em] sm:text-[26px]"
          >
            {copy.titleLead}{" "}
            <span className="text-cmt-primary-700">{copy.titleHighlight}</span>
          </h2>
          <p className="mt-1.5 text-[14px] leading-[1.5] text-cmt-neutral-500">
            {tab === "login" ? copy.loginSubtitle : copy.signupSubtitle}
          </p>

          {/* Segmented control — the choice changes what the fields below mean */}
          <div
            role="tablist"
            aria-label="Log in or sign up"
            className="mt-5 inline-flex w-full rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-100 p-1"
          >
            {([
              ["login", "Log in"],
              ["signup", "Sign up"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                disabled={busy}
                onClick={() => switchTab(value)}
                className={`flex-1 rounded-[calc(var(--cmt-radius-control)-2px)] px-4 py-2 text-[14px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed ${
                  tab === value
                    ? "bg-cmt-white text-cmt-neutral-900 shadow-cmt-xs"
                    : "text-cmt-neutral-500 hover:text-cmt-neutral-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-3" noValidate>
              {formError ? <AuthAlert message={formError} /> : null}
              <TextField
                label="Email"
                type="email"
                name="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
                icon={<Mail size={20} aria-hidden="true" />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <TextField
                label="Password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                isPassword
                icon={<Lock size={20} aria-hidden="true" />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <div className="mt-1 flex items-center justify-between gap-4">
                <Checkbox checked={rememberMe} onChange={setRememberMe}>
                  Remember me
                </Checkbox>
                <Link
                  href="/forgot-password"
                  onClick={() => close()}
                  className="text-[14px] font-semibold text-cmt-primary-900 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="mt-2" icon={<ArrowRight size={20} />} isLoading={isSubmitting} disabled={busy}>
                Log In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="mt-5 flex flex-col gap-3" noValidate>
              {formError ? <AuthAlert message={formError} /> : null}
              <TextField
                label="Full name"
                name="name"
                placeholder="Enter your full name"
                autoComplete="name"
                required
                icon={<User size={20} aria-hidden="true" />}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
              <TextField
                label="Email"
                type="email"
                name="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
                icon={<Mail size={20} aria-hidden="true" />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <PhoneNumberField required value={phone} onChange={setPhone} />
              <TextField
                label="Password"
                name="new-password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                isPassword
                icon={<Lock size={20} aria-hidden="true" />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <div className="mt-1">
                <Checkbox checked={agreedToTerms} onChange={setAgreedToTerms} required>
                  I agree to the{" "}
                  <Link href="/terms" onClick={() => close()} className="font-semibold text-cmt-primary-900 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" onClick={() => close()} className="font-semibold text-cmt-primary-900 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </Checkbox>
              </div>
              <Button type="submit" className="mt-2" icon={<ArrowRight size={20} />} isLoading={isSubmitting} disabled={busy}>
                Create Account
              </Button>
            </form>
          )}

          <div className="my-4">
            <Divider label="or continue with" />
          </div>

          <Button
            type="button"
            variant="outline"
            leadingIcon={<GoogleIcon />}
            isLoading={isGoogleSubmitting}
            disabled={busy}
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-cmt-neutral-100 pt-4">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {copy.trust.map(({ id, icon, label }) => (
                <li key={id} className="flex items-center gap-1.5">
                  <Glyph name={icon} className="h-3.5 w-3.5 text-cmt-primary-700" />
                  <span className="text-[12px] leading-[1.3] text-cmt-neutral-500">{label}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => close()}
              className="text-[13px] font-semibold text-cmt-neutral-500 underline-offset-2 transition-colors duration-200 hover:text-cmt-neutral-900 hover:underline"
            >
              {copy.dismissLabel}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
