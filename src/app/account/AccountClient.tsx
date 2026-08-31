"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import PhoneNumberField from "@/components/PhoneNumberField";
import { getFirebaseDb } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/firebase/auth";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useUserProfile, type UserProfile } from "@/lib/firebase/useUserProfile";
import { USER_PROFILE_SAVED_EVENT } from "@/lib/firebase/profileEvents";
import AccountQuoteRequests from "./AccountQuoteRequests";
import AccountTrips from "./AccountTrips";

/* ------------------------------------------------------------------ */
/* Account page (design.md §5 spacing, §6.2 container, §8.3 cards).     */
/*                                                                      */
/* Order is deliberate: what the traveller came to check — their trips —  */
/* leads, and account admin sits below it. Settings are a task you do    */
/* occasionally; a booking is the thing you keep coming back to look at. */
/*                                                                      */
/* Yellow budget (§3.9: one primary CTA per viewport): "Save profile" is  */
/* the page's single yellow action. Everything else that needs emphasis   */
/* uses the primary-100 backplate or the neutral-900 secondary button, so  */
/* the gold keeps its meaning. The one dark block on the page is the      */
/* next-trip countdown in AccountTrips — the sanctioned dark-card use.     */
/* ------------------------------------------------------------------ */

const FIELD =
  "h-12 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-[15px] text-cmt-neutral-900 outline-none transition-colors duration-150 placeholder:text-cmt-neutral-400 hover:border-cmt-neutral-300 focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20";

/* 14px/600/neutral-700 to match PhoneNumberField and the login, signup and
   checkout forms. §8.2 specifies an 11px uppercase label, but no shipped form
   uses it — per THE RULE (§1.5), match the established system rather than
   making this one page diverge. Worth changing site-wide, not here alone. */
const FIELD_LABEL = "mb-2 block font-body text-[14px] font-semibold text-cmt-neutral-700";

/* Section heading — Label overline + H2, matching the rest of the site. */
function SectionHead({
  overline,
  title,
  hint,
}: {
  overline: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="max-w-[560px]">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-cmt-primary-900">
        {overline}
      </p>
      <h2 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.003em] text-cmt-neutral-900 sm:text-[26px]">
        {title}
      </h2>
      <p className="mt-1.5 font-body text-sm leading-[1.55] text-cmt-neutral-600">{hint}</p>
    </div>
  );
}

/* §8.4: family-100 fill, family-tinted border, bold lead word. */
function Alert({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  const success = tone === "success";
  return (
    <p
      role={success ? "status" : "alert"}
      className={`mt-5 flex items-start gap-3 rounded-cmt-control border px-4 py-3 font-body text-sm leading-[1.55] ${
        success
          ? "border-cmt-success-500/40 bg-cmt-success-100 text-cmt-neutral-900"
          : "border-cmt-error-500/40 bg-cmt-error-100 text-cmt-neutral-900"
      }`}
    >
      <CheckCircle2
        className={`mt-0.5 size-4 shrink-0 ${success ? "text-cmt-success-700" : "hidden"}`}
        aria-hidden="true"
      />
      <span>
        <span className="font-semibold">{success ? "Saved. " : "Couldn’t save. "}</span>
        {children}
      </span>
    </p>
  );
}

/* Card shell — §8.3: white, 16px radius, 1px neutral-200, 24px pad, shadow-sm. */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-6">
      {children}
    </div>
  );
}

function CardHead({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof UserRound;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* 32px icon on a 48px primary-100 backplate, per the feature-card spec. */}
      <span className="grid size-12 shrink-0 place-items-center rounded-cmt-full bg-cmt-primary-100 text-cmt-primary-900">
        <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-[20px] font-medium leading-[1.35] text-cmt-neutral-900">
          {title}
        </h3>
        <p className="mt-0.5 font-body text-xs leading-[1.5] text-cmt-neutral-500">{hint}</p>
      </div>
    </div>
  );
}

export default function AccountClient() {
  const router = useRouter();
  const user = useAuthUser();
  const profileState = useUserProfile();

  useEffect(() => {
    if (user === null) router.replace("/login");
  }, [router, user]);

  if (user === null) return null;
  if (!user || profileState.status === "loading") {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <LoaderCircle className="size-8 animate-spin text-cmt-primary-700" aria-label="Loading account" />
      </div>
    );
  }
  if (profileState.status !== "ready") return null;

  return <AccountForms key={user.uid} user={user} profile={profileState.profile} />;
}

function AccountForms({ user, profile }: { user: User; profile: UserProfile }) {
  const [name, setName] = useState(profile.name || user.displayName || "");
  const [phone, setPhone] = useState(profile.phone || "+91");
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState(
    user.providerData.some((provider) => provider.providerId === "password"),
  );
  const email = user.email ?? profile.email;
  const firstName = (profile.name || user.displayName || "").trim().split(/\s+/)[0] ?? "";

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, "");
    setProfileError("");
    setProfileSaved(false);
    if (cleanName.length < 2) return setProfileError("Enter your full name.");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return setProfileError("Enter a valid phone number with 7 to 15 digits.");
    }

    try {
      setSavingProfile(true);
      await Promise.all([
        setDoc(
          doc(getFirebaseDb(), "users", user.uid),
          {
            name: cleanName,
            email,
            phone: cleanPhone,
            profileCompletedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ),
        user.displayName === cleanName ? Promise.resolve() : updateProfile(user, { displayName: cleanName }),
      ]);
      window.dispatchEvent(new CustomEvent(USER_PROFILE_SAVED_EVENT, { detail: { uid: user.uid } }));
      setProfileSaved(true);
    } catch (cause) {
      setProfileError(cause instanceof Error ? cause.message : "Your profile could not be updated.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);
    if (!email) return setPasswordError("This account does not have an email address.");
    if (newPassword.length < 8) return setPasswordError("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setPasswordError("New passwords do not match.");
    if (hasPassword && !currentPassword) return setPasswordError("Enter your current password.");

    try {
      setSavingPassword(true);
      if (hasPassword) {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, currentPassword));
        await updatePassword(user, newPassword);
      } else {
        await linkWithCredential(user, EmailAuthProvider.credential(email, newPassword));
        setHasPassword(true);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
    } catch (cause) {
      setPasswordError(getAuthErrorMessage(cause));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1140px] px-4 py-10 sm:px-5 sm:py-12 lg:px-6 lg:py-16">
      {/* ---------------------------------------------------------------- */}
      {/* Page head                                                         */}
      {/* ---------------------------------------------------------------- */}
      <header className="max-w-[640px]">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-cmt-primary-900">
          My account
        </p>
        <h1 className="mt-2 text-balance font-display text-[26px] font-semibold leading-[1.2] tracking-[-0.005em] text-cmt-neutral-900 sm:text-[32px] lg:text-[40px]">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-3 text-pretty font-body text-[15px] leading-[1.6] text-cmt-neutral-600 sm:text-base">
          Track where your bookings stand, and keep your travel details up to date.
        </p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Trips — first, because it is what people open this page for        */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-10 lg:mt-12">
        <AccountTrips userId={user.uid} />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Profile + sign-in                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-12 lg:mt-16">
        <SectionHead
          overline="Personal settings"
          title="Your details"
          hint="These are the contact details we use for booking confirmations and operator updates."
        />

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
          <Card>
            <form onSubmit={saveProfile} noValidate>
              <CardHead icon={UserRound} title="Profile details" hint="Your name and contact number." />

              {profileError ? <Alert tone="error">{profileError}</Alert> : null}
              {profileSaved ? <Alert tone="success">Your profile has been updated.</Alert> : null}

              <div className="mt-6 space-y-5">
                <label className="block">
                  <span className={FIELD_LABEL}>Full name</span>
                  <span className="relative block">
                    <UserRound
                      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
                      aria-hidden="true"
                    />
                    <input
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className={`${FIELD} pl-11`}
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-body text-[14px] font-semibold text-cmt-neutral-700">
                      Email address
                    </span>
                    <span className="rounded-cmt-full bg-cmt-neutral-100 px-2.5 py-1 font-body text-[11px] font-semibold text-cmt-neutral-500">
                      Cannot be changed
                    </span>
                  </span>
                  <span className="relative block">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      readOnly
                      aria-readonly="true"
                      value={email}
                      className={`${FIELD} cursor-not-allowed border-cmt-neutral-200 bg-cmt-neutral-100 pl-11 text-cmt-neutral-500 hover:border-cmt-neutral-200`}
                    />
                  </span>
                </label>

                <PhoneNumberField required value={phone} onChange={setPhone} />
              </div>

              {/* The page's single yellow action — §3.9. */}
              <button
                disabled={savingProfile}
                type="submit"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 font-body text-[15px] font-semibold tracking-[0.005em] text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-wait disabled:bg-cmt-neutral-100 disabled:text-cmt-neutral-400 disabled:shadow-none disabled:hover:translate-y-0"
              >
                <Save className="size-4" strokeWidth={2.5} aria-hidden="true" />
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
            </form>
          </Card>

          <Card>
            <form onSubmit={savePassword} noValidate>
              <CardHead
                icon={hasPassword ? KeyRound : ShieldCheck}
                title={hasPassword ? "Change password" : "Add a password"}
                hint={
                  hasPassword
                    ? "Update the password for your email login."
                    : "Set one so you can also sign in with your email."
                }
              />

              {passwordError ? <Alert tone="error">{passwordError}</Alert> : null}
              {passwordSaved ? (
                <Alert tone="success">
                  Your password has been {hasPassword ? "changed" : "added"}.
                </Alert>
              ) : null}

              <div className="mt-6 space-y-5">
                {hasPassword ? (
                  <label className="block">
                    <span className={FIELD_LABEL}>Current password</span>
                    <span className="relative block">
                      <LockKeyhole
                        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
                        aria-hidden="true"
                      />
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        className={`${FIELD} pl-11`}
                      />
                    </span>
                  </label>
                ) : null}

                <label className="block">
                  <span className={FIELD_LABEL}>New password</span>
                  <span className="relative block">
                    <LockKeyhole
                      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
                      aria-hidden="true"
                    />
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className={`${FIELD} pl-11`}
                    />
                  </span>
                  <span className="mt-1.5 block font-body text-xs leading-[1.5] text-cmt-neutral-500">
                    Use at least 8 characters.
                  </span>
                </label>

                <label className="block">
                  <span className={FIELD_LABEL}>Confirm new password</span>
                  <span className="relative block">
                    <LockKeyhole
                      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
                      aria-hidden="true"
                    />
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={`${FIELD} pl-11`}
                    />
                  </span>
                </label>
              </div>

              {/* Secondary action — dark fill, so the page keeps one gold CTA. */}
              <button
                disabled={savingPassword}
                type="submit"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-cmt-control bg-cmt-neutral-900 px-5 font-body text-[15px] font-semibold tracking-[0.005em] text-white transition-colors duration-200 hover:bg-cmt-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-neutral-900 disabled:cursor-wait disabled:bg-cmt-neutral-300 disabled:text-white"
              >
                <KeyRound className="size-4" strokeWidth={2.5} aria-hidden="true" />
                {savingPassword ? "Saving…" : hasPassword ? "Change password" : "Add password"}
              </button>
            </form>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Quote requests                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-12 lg:mt-16">
        <AccountQuoteRequests userId={user.uid} />
      </section>
    </div>
  );
}
