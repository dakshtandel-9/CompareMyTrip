"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, ShieldCheck, BadgeCheck, Headset, User } from "lucide-react";
import SplitAuthShell from "../_components/SplitAuthShell";
import TextField from "../_components/TextField";
import Checkbox from "../_components/Checkbox";
import Button from "../_components/Button";
import Divider from "../_components/Divider";
import GoogleIcon from "../_components/GoogleIcon";
import AuthAlert from "../_components/AuthAlert";
import { signInWithEmail, signInWithGoogle, getAuthErrorMessage } from "@/lib/firebase/auth";

const trustItems = [
  { icon: ShieldCheck, label: "Secure Payments", description: "Your data is protected with 256-bit encryption." },
  { icon: BadgeCheck, label: "Best Price Guarantee", description: "Find the best deals or we make it right." },
  { icon: Headset, label: "24/7 Support", description: "We're here to help you anytime." },
];

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/");
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
      router.push("/");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <SplitAuthShell
      navPrompt={<>New here? <Link href="/signup" className="font-semibold text-cmt-primary-900 hover:underline">Sign up</Link></>}
      title="Welcome back!"
      subtitle="Log in to continue comparing and booking the best travel deals."
      imageSrc="/auth/signup.png"
      imageAlt="Airplane wing above the clouds at sunset"
      headline={<>Travel Smarter,<br /><span className="text-cmt-primary-400">Save More.</span></>}
      imageSubcopy="Compare flights, hotels and holiday packages from 500+ partners and get the best deals instantly."
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
          {trustItems.map(({ icon: Icon, label, description }) => (
            <div key={label} className="flex flex-col items-start gap-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-cmt-full bg-cmt-primary-100"><Icon size={16} className="text-cmt-primary-900" aria-hidden="true" /></span>
              <p className="text-[12px] font-semibold leading-[1.3] text-cmt-neutral-900">{label}</p>
              <p className="text-[11px] leading-[1.4] text-cmt-neutral-500">{description}</p>
            </div>
          ))}
        </div>
      </form>
    </SplitAuthShell>
  );
}
