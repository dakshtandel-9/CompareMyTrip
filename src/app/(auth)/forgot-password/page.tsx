"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import AuthAlert from "../_components/AuthAlert";
import Button from "../_components/Button";
import SplitAuthShell from "../_components/SplitAuthShell";
import TextField from "../_components/TextField";
import { getAuthErrorMessage, requestPasswordReset } from "@/lib/firebase/auth";
import { useSiteContent } from "@/lib/useSiteContent";

export default function ForgotPasswordPage() {
  const { auth } = useSiteContent();
  const copy = auth.login;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setMessage("If an account exists for that email, a password-reset link is on its way.");
    } catch (cause) {
      setError(getAuthErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SplitAuthShell
      navPrompt={<Link href="/login" className="font-semibold text-cmt-primary-900 hover:underline">Back to sign in</Link>}
      title="Reset your password"
      subtitle="Enter the email address connected to your account."
      imageSrc={copy.image}
      imageAlt={copy.imageAlt}
      headline={<>Find your way<br /><span className="text-cmt-primary-400">back to your trips.</span></>}
      imageSubcopy="We will send a secure reset link to the email address on your account."
      imagePanelBottom={<div />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error ? <AuthAlert message={error} /> : null}
        {message ? <p role="status" className="rounded-cmt-control border border-cmt-success-500/20 bg-cmt-success-100 px-4 py-3 text-sm text-cmt-success-700">{message}</p> : null}
        <TextField label="Email address" type="email" name="email" autoComplete="email" required icon={<Mail size={20} aria-hidden="true" />} value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button type="submit" isLoading={submitting}>Send reset link</Button>
        <Link href="/login" className="mx-auto inline-flex items-center gap-2 text-sm font-semibold text-cmt-neutral-700 hover:text-cmt-neutral-900">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to sign in
        </Link>
      </form>
    </SplitAuthShell>
  );
}
