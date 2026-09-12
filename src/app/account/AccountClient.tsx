"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  signOut,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  ArrowRight,
  ChevronRight,
  Headphones,
  LogOut,
  Luggage,
  MessageSquareText,
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
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/firebase/auth";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useUserProfile, type UserProfile } from "@/lib/firebase/useUserProfile";
import { USER_PROFILE_SAVED_EVENT } from "@/lib/firebase/profileEvents";
import AccountQuoteRequests from "./AccountQuoteRequests";
import AccountTrips from "./AccountTrips";

type AccountSection = "trips" | "quotes" | "profile" | "security";

const SECTIONS = [
  { id: "trips", label: "My trips", icon: Luggage },
  { id: "quotes", label: "Quote requests", icon: MessageSquareText },
  { id: "profile", label: "Personal details", icon: UserRound },
  { id: "security", label: "Login & security", icon: ShieldCheck },
] as const;

const FIELD =
  "h-12 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-[15px] text-cmt-neutral-900 outline-none transition-colors duration-150 placeholder:text-cmt-neutral-400 hover:border-cmt-neutral-300 focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20";

const FIELD_LABEL = "mb-2 block font-body text-[14px] font-semibold text-cmt-neutral-700";

/* Shared heading for the two account settings panels. */
function SectionHead({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="max-w-[560px]">
      <h2 className="font-display text-[22px] font-semibold tracking-[-0.003em] text-cmt-neutral-900 sm:text-[26px]">
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<AccountSection>("trips");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
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
  const displayName = profile.name || user.displayName || "Traveller";
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const logout = async () => {
    setSigningOut(true);
    setSignOutError("");
    try {
      await signOut(getFirebaseAuth());
    } catch (cause) {
      setSignOutError(getAuthErrorMessage(cause));
      setSigningOut(false);
    }
  };
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
    <div className="cmt-account mx-auto w-full max-w-[1440px] px-4 py-8 font-body sm:px-5 sm:py-10 lg:px-6 lg:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cmt-primary-900">Your travel space</p>
          <h1 className="font-display text-[26px] font-semibold leading-[1.2] tracking-[-0.005em] text-cmt-neutral-900 sm:text-[32px] lg:text-[40px]">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}<span className="text-cmt-primary-700">.</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-cmt-neutral-600 sm:text-base">Your trips, your plans, all in one place.</p>
        </div>
        <Link href="/packages" className="inline-flex h-11 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-5 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-colors hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">
          Explore packages <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-28 lg:col-span-3">
          <div className="overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
            <div className="flex items-center gap-3 border-b border-cmt-neutral-100 p-5 lg:flex-col lg:items-start lg:p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-cmt-full bg-cmt-primary-100 font-display text-xl font-semibold text-cmt-primary-900 lg:size-16 lg:text-2xl" aria-hidden="true">{initials}</span>
              <div className="min-w-0 w-full">
                <p className="break-words font-display text-lg font-semibold capitalize text-cmt-neutral-900">{displayName}</p>
                <p className="mt-1 break-all text-xs leading-relaxed text-cmt-neutral-500">{email}</p>
              </div>
            </div>
            <nav aria-label="Account sections" className="grid grid-cols-2 gap-1 p-2 lg:grid-cols-1 lg:p-3">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" aria-current={activeSection === id ? "page" : undefined} aria-controls={`account-${id}`} onClick={() => {
                  setActiveSection(id);
                  contentRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
                }} className={`flex min-h-12 items-center gap-2 rounded-cmt-control px-3 py-3 text-left text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:text-sm lg:gap-3 ${activeSection === id ? "bg-cmt-primary-50 text-cmt-primary-900" : "text-cmt-neutral-600 hover:bg-cmt-neutral-50 hover:text-cmt-neutral-900"}`}>
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className={`hidden size-4 lg:block ${activeSection === id ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
                </button>
              ))}
            </nav>
            <div className="border-t border-cmt-neutral-100 p-3">
              <button type="button" onClick={logout} disabled={signingOut} className="flex min-h-11 w-full items-center gap-3 rounded-cmt-control px-3 text-sm font-medium text-cmt-neutral-500 transition-colors hover:bg-cmt-neutral-50 hover:text-cmt-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:opacity-50">
                <LogOut className="size-4" aria-hidden="true" />{signingOut ? "Signing out…" : "Sign out"}
              </button>
              {signOutError ? <p role="alert" className="px-3 pb-2 text-xs text-cmt-error-700">{signOutError}</p> : null}
            </div>
          </div>
          <div className="mt-5 hidden rounded-cmt-md border border-cmt-neutral-200 p-5 lg:block">
            <Headphones className="size-5 text-cmt-neutral-600" aria-hidden="true" />
            <h2 className="mt-3 font-display text-base font-semibold text-cmt-neutral-900">Need help with a booking?</h2>
            <p className="mt-2 text-xs leading-relaxed text-cmt-neutral-500">Questions about a booking? Our travel team is here to help.</p>
            <Link href="/contact" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cmt-neutral-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">Contact support <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </aside>

        <div ref={contentRef} className="min-w-0 scroll-mt-28 lg:col-span-9">
          <section id="account-trips" aria-label="My trips" hidden={activeSection !== "trips"}>
            <AccountTrips userId={user.uid} />
          </section>
          <section id="account-quotes" aria-label="Quote requests" hidden={activeSection !== "quotes"}>
            <AccountQuoteRequests userId={user.uid} />
          </section>
          <section id="account-profile" aria-label="Personal details" hidden={activeSection !== "profile"}>
            <SectionHead title="Personal details" hint="Keep your contact details up to date for booking confirmations and trip updates." />
            <div className="mt-6">
              <Card>
                <form onSubmit={saveProfile} noValidate>
                  <CardHead icon={UserRound} title="Profile details" hint="Your name and contact number." />

                  {profileError ? <Alert tone="error">{profileError}</Alert> : null}
                  {profileSaved ? <Alert tone="success">Your profile has been updated.</Alert> : null}

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
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

                    <PhoneNumberField required value={phone} onChange={setPhone} />

                    <label className="block sm:col-span-2">
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
                  </div>

                  {/* The page's single yellow action — §3.9. */}
                  <button
                    disabled={savingProfile}
                    type="submit"
                    className="mt-8 inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 font-body text-[15px] font-semibold tracking-[0.005em] text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-wait disabled:bg-cmt-neutral-100 disabled:text-cmt-neutral-400 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    <Save className="size-4" strokeWidth={2.5} aria-hidden="true" />
                    {savingProfile ? "Saving…" : "Save profile"}
                  </button>
                </form>
              </Card>

            </div>
          </section>
          <section id="account-security" aria-label="Login and security" hidden={activeSection !== "security"}>
            <SectionHead title="Login & security" hint="Manage how you sign in to your CompareMyTrip account." />
            <div className="mt-6">
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
                      Your password has been saved.
                    </Alert>
                  ) : null}

                  <div className="mt-6 max-w-[560px] space-y-5">
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
                    className="mt-8 inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-cmt-control bg-cmt-neutral-900 px-5 font-body text-[15px] font-semibold tracking-[0.005em] text-white transition-colors duration-200 hover:bg-cmt-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-neutral-900 disabled:cursor-wait disabled:bg-cmt-neutral-300 disabled:text-white"
                  >
                    <KeyRound className="size-4" strokeWidth={2.5} aria-hidden="true" />
                    {savingPassword ? "Saving…" : hasPassword ? "Change password" : "Add password"}
                  </button>
                </form>
              </Card>
            </div>
          </section>
          <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-cmt-neutral-500 lg:hidden"><Headphones className="size-4" aria-hidden="true" />Need a hand? <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-cmt-neutral-900 underline underline-offset-4">Contact support</Link></p>
        </div>
      </div>
    </div>
  );
}
