"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, User } from "lucide-react";
import SplitAuthShell from "../_components/SplitAuthShell";
import TextField from "../_components/TextField";
import Checkbox from "../_components/Checkbox";
import Button from "../_components/Button";
import Divider from "../_components/Divider";
import GoogleIcon from "../_components/GoogleIcon";
import AuthAlert from "../_components/AuthAlert";
import { signInWithEmail, signInWithGoogle, getAuthErrorMessage } from "@/lib/firebase/auth";
import { Glyph } from "@/lib/adminIcons";
import { useSiteContent } from "@/lib/useSiteContent";

export default function LoginPage() {
  const router = useRouter();
  /* Where to land after signing in. Only same-site paths are honoured, so a
     crafted ?next= cannot bounce a freshly signed-in customer off-site. */
  const nextParam = useSearchParams().get("next") ?? "";
  const destination = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  /* Copy, icons and artwork only — the form below is code, not content. */
  const { auth } = useSiteContent();
  const copy = auth.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const busy = isSubmitting || isGoogleSubmitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!email || !password) {
      setFormError("Please enter your email and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      await signInWithEmail({ email, password, remember: rememberMe });
      router.push(destination);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setFormError("");
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      router.push(destination);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <SplitAuthShell
      navPrompt={<>{copy.navPrompt} <Link href="/signup" className="font-semibold text-cmt-primary-900 hover:underline">{copy.navLinkLabel}</Link></>}
      title={copy.title}
      subtitle={copy.subtitle}
      imageSrc={copy.image}
      imageAlt={copy.imageAlt}
      headline={<>{copy.headlineLead}<br /><span className="text-cmt-primary-400">{copy.headlineHighlight}</span></>}
      imageSubcopy={copy.imageSubcopy}
      imagePanelBottom={
        <div className="flex items-center gap-3 rounded-cmt-md border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex -space-x-3">
            {[0, 1, 2].map((index) => <span key={index} className="flex h-9 w-9 items-center justify-center rounded-cmt-full border-2 border-cmt-neutral-900 bg-cmt-primary-100"><User size={16} className="text-cmt-primary-900" aria-hidden="true" /></span>)}
          </div>
          <p className="text-[13px] leading-[1.4] text-cmt-white">Trusted by <span className="font-semibold">2M+ travelers</span> worldwide</p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        {formError ? <AuthAlert message={formError} /> : null}
        <TextField label="Email" type="email" name="email" placeholder="Enter your email" autoComplete="email" required icon={<Mail size={20} aria-hidden="true" />} value={email} onChange={(event) => setEmail(event.target.value)} />
        <TextField label="Password" name="password" placeholder="Enter your password" autoComplete="current-password" required isPassword icon={<Lock size={20} aria-hidden="true" />} value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="mt-1 flex items-center justify-between">
          <Checkbox checked={rememberMe} onChange={setRememberMe}>Remember me</Checkbox>
          <Link href="/forgot-password" className="text-[14px] font-semibold text-cmt-primary-900 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="mt-2" icon={<ArrowRight size={20} />} isLoading={isSubmitting} disabled={busy}>Log In</Button>
        <div className="my-1"><Divider label="or continue with" /></div>
        <Button type="button" variant="outline" leadingIcon={<GoogleIcon />} isLoading={isGoogleSubmitting} disabled={busy} onClick={handleGoogleSignIn}>Continue with Google</Button>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-cmt-neutral-100 pt-5">
          {copy.trust.map(({ id, icon, label, description }) => (
            <div key={id} className="flex flex-col items-start gap-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-cmt-full bg-cmt-primary-100"><Glyph name={icon} className="h-4 w-4 text-cmt-primary-900" /></span>
              <p className="text-[12px] font-semibold leading-[1.3] text-cmt-neutral-900">{label}</p>
              <p className="text-[11px] leading-[1.4] text-cmt-neutral-500">{description}</p>
            </div>
          ))}
        </div>
      </form>
    </SplitAuthShell>
  );
}
