"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import SplitAuthShell from "../_components/SplitAuthShell";
import TextField from "../_components/TextField";
import PasswordStrength from "../_components/PasswordStrength";
import Checkbox from "../_components/Checkbox";
import Button from "../_components/Button";
import Divider from "../_components/Divider";
import GoogleIcon from "../_components/GoogleIcon";
import AuthAlert from "../_components/AuthAlert";
import { signUpWithEmail, signInWithGoogle, getAuthErrorMessage } from "@/lib/firebase/auth";
import PhoneNumberField from "@/components/PhoneNumberField";
import { Glyph } from "@/lib/adminIcons";
import { useSiteContent } from "@/lib/useSiteContent";

export default function SignupPage() {
  const router = useRouter();
  /* Copy, icons and artwork only — the form below is code, not content. */
  const { auth } = useSiteContent();
  const copy = auth.signup;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const busy = isSubmitting || isGoogleSubmitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setFormError("Please fill in every field.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 8) {
      setFormError("Please enter a valid phone number.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setFormError("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }
    setIsSubmitting(true);
    try {
      await signUpWithEmail({ name: fullName, email, phone, password });
      router.push("/");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignUp() {
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
      navPrompt={<>{copy.navPrompt} <Link href="/login" className="font-semibold text-cmt-primary-900 hover:underline">{copy.navLinkLabel}</Link></>}
      title={copy.title}
      subtitle={copy.subtitle}
      imageSrc={copy.image}
      imageAlt={copy.imageAlt}
      headline={<>{copy.headlineLead}<br /><span className="text-cmt-primary-400">{copy.headlineHighlight}</span></>}
      imageSubcopy={copy.imageSubcopy}
      imagePanelBottom={
        <div className="flex flex-col gap-3">
          {copy.features.map(({ id, icon, title, description }) => (
            <div key={id} className="flex items-center gap-3 rounded-cmt-md border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-cmt-full bg-cmt-primary-500"><Glyph name={icon} className="h-[18px] w-[18px] text-cmt-neutral-900" /></span>
              <div><p className="text-[13px] font-semibold leading-[1.3] text-cmt-white">{title}</p><p className="text-[12px] leading-[1.4] text-cmt-neutral-300">{description}</p></div>
            </div>
          ))}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
        {formError ? <AuthAlert message={formError} /> : null}
        <TextField label="Full Name" name="fullName" placeholder="Enter your full name" autoComplete="name" required icon={<User size={20} aria-hidden="true" />} value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <TextField label="Email Address" type="email" name="email" placeholder="Enter your email" autoComplete="email" required icon={<Mail size={20} aria-hidden="true" />} value={email} onChange={(event) => setEmail(event.target.value)} />
        <PhoneNumberField label="Phone Number" required value={phone} onChange={setPhone} />
        <div className="flex flex-col gap-2">
          <TextField label="Password" name="password" placeholder="Create a password" autoComplete="new-password" required isPassword icon={<Lock size={20} aria-hidden="true" />} value={password} onChange={(event) => setPassword(event.target.value)} />
          <PasswordStrength password={password} />
        </div>
        <TextField label="Confirm Password" name="confirmPassword" placeholder="Confirm your password" autoComplete="new-password" required isPassword icon={<Lock size={20} aria-hidden="true" />} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={passwordsMismatch ? "Passwords do not match" : undefined} />
        <div className="mt-1">
          <Checkbox checked={agreedToTerms} onChange={setAgreedToTerms} required>
            I agree to the <Link href="/terms" className="font-semibold text-cmt-primary-900 hover:underline">Terms &amp; Conditions</Link> and <Link href="/privacy" className="font-semibold text-cmt-primary-900 hover:underline">Privacy Policy</Link>
          </Checkbox>
        </div>
        <Button type="submit" className="mt-1" icon={<ArrowRight size={20} />} isLoading={isSubmitting} disabled={busy}>Sign Up</Button>
        <div className="my-1"><Divider label="or sign up with" /></div>
        <Button type="button" variant="outline" leadingIcon={<GoogleIcon />} isLoading={isGoogleSubmitting} disabled={busy} onClick={handleGoogleSignUp}>Continue with Google</Button>
      </form>
    </SplitAuthShell>
  );
}
