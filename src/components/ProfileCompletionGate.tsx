"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { LoaderCircle, Mail, UserRound } from "lucide-react";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import {
  consumeCompletedProfile,
  USER_PROFILE_SAVED_EVENT,
  type UserProfileSavedDetail,
} from "@/lib/firebase/profileEvents";
import PhoneNumberField from "@/components/PhoneNumberField";
import {
  createProfileSaveController,
  getProfileSaveStateForUser,
  IDLE_PROFILE_SAVE_STATE,
  ProfileSaveTimeoutError,
} from "@/lib/firebase/profileSave";

type ProfileCheck = { uid: string; complete: boolean; needsCreatedAt?: boolean };

function isComplete(name: string, email: string, phone: string) {
  return Boolean(name.trim() && email.trim() && phone.trim());
}

export default function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const user = useAuthUser();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const profileRequestRef = useRef(0);
  const saveControllerRef = useRef(createProfileSaveController());
  const [profile, setProfile] = useState<ProfileCheck | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState(IDLE_PROFILE_SAVE_STATE);
  const { saving, pending: savePending, failed: saveFailed } = getProfileSaveStateForUser(saveState, user?.uid);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [incompleteReadyForUid, setIncompleteReadyForUid] = useState<string | null>(null);
  const isGoogleAccount = user?.providerData.some((provider) => provider.providerId === "google.com") ?? false;

  const status =
    user === undefined
      ? "checking"
      : user === null
        ? "complete"
        : profile?.uid === user.uid
          ? profile.complete
            ? "complete"
            : "incomplete"
          : "checking";
  const incompleteUid = status === "incomplete" ? user?.uid ?? null : null;
  const showIncomplete = incompleteUid !== null && incompleteReadyForUid === incompleteUid;

  useEffect(() => {
    if (!user) return;

    let active = true;
    let settled = false;
    const requestId = ++profileRequestRef.current;
    if (consumeCompletedProfile(user.uid)) {
      queueMicrotask(() => {
        if (active) setProfile({ uid: user.uid, complete: true });
      });
      return () => {
        active = false;
      };
    }

    const canApply = () => active && !settled && requestId === profileRequestRef.current;
    function failProfileLoad() {
      if (!canApply() || !user) return;
      settled = true;
      window.clearTimeout(timeout);
      setProfileLoadFailed(true);
      setError("We couldn't load your saved profile. Check your connection and retry.");
      setProfile({ uid: user.uid, complete: false });
    }
    // Firestore can remain pending offline. Offer a retry instead of leaving
    // a successfully signed-in visitor underneath an endless loading cover.
    const timeout = window.setTimeout(failProfileLoad, 10000);
    Promise.resolve().then(() => getDoc(doc(getFirebaseDb(), "users", user.uid)))
      .then((profileDocument) => {
        if (!canApply()) return;
        settled = true;
        window.clearTimeout(timeout);
        const data = profileDocument.data();
        const nextName = typeof data?.name === "string" ? data.name : user.displayName ?? "";
        const nextEmail =
          user.providerData.some((provider) => provider.providerId === "google.com")
            ? user.email ?? ""
            : typeof data?.email === "string"
              ? data.email
              : user.email ?? "";
        const nextPhone = typeof data?.phone === "string" ? data.phone : "";

        setName(nextName);
        setEmail(nextEmail);
        setPhone(nextPhone || "+91");
        setProfileLoadFailed(false);
        setError("");
        setProfile({ uid: user.uid, complete: isComplete(nextName, nextEmail, nextPhone), needsCreatedAt: !data?.createdAt });
      })
      .catch(failProfileLoad);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [user, profileAttempt]);

  useEffect(() => {
    if (!user) return;

    function handleProfileSaved(event: Event) {
      const detail = (event as CustomEvent<UserProfileSavedDetail>).detail;
      if (detail?.uid === user?.uid) {
        // An older in-flight read must not undo a profile just saved at signup.
        profileRequestRef.current++;
        setProfile({ uid: detail.uid, complete: true });
      }
    }

    window.addEventListener(USER_PROFILE_SAVED_EVENT, handleProfileSaved);
    return () => window.removeEventListener(USER_PROFILE_SAVED_EVENT, handleProfileSaved);
  }, [user]);

  useEffect(() => {
    if (!incompleteUid) return;
    const timer = window.setTimeout(() => {
      setIncompleteReadyForUid(incompleteUid);
    }, 750);
    return () => window.clearTimeout(timer);
  }, [incompleteUid]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (showIncomplete && dialog && !dialog.open) dialog.showModal();
    if (!showIncomplete && dialog?.open) dialog.close();
  }, [showIncomplete]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user || profileLoadFailed) return;

    const cleanName = name.trim();
    const cleanEmail = (isGoogleAccount ? user.email ?? "" : email).trim().toLowerCase();
    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, "");

    if (cleanName.length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setError("Enter a valid phone number with 7 to 15 digits.");
      return;
    }

    setSaveState({ uid: user.uid, saving: true, pending: true, failed: false });
    setError("");
    const stillSignedIn = () => getFirebaseAuth().currentUser?.uid === user.uid;
    try {
      await saveControllerRef.current.start(user.uid, async () => {
        const results = await Promise.allSettled([
        setDoc(
          doc(getFirebaseDb(), "users", user.uid),
          {
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            ...(isGoogleAccount ? { provider: "google" } : {}),
            ...(profile?.uid === user.uid && profile.needsCreatedAt ? { createdAt: serverTimestamp() } : {}),
            profileCompletedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ),
        user.displayName === cleanName ? Promise.resolve() : updateProfile(user, { displayName: cleanName }),
        ]);
        const failure = results.find((result) => result.status === "rejected");
        if (failure?.status === "rejected") throw failure.reason;
      }, () => {
        if (!stillSignedIn()) return;
        profileRequestRef.current++;
        setProfile({ uid: user.uid, complete: true });
        setSaveState({ uid: user.uid, saving: false, pending: false, failed: false });
        setError("");
      });
    } catch (cause) {
      if (!stillSignedIn()) return;
      setSaveState({ uid: user.uid, saving: false, pending: cause instanceof ProfileSaveTimeoutError, failed: true });
      setError(cause instanceof Error ? cause.message : "Your details could not be saved. Please try again.");
    } finally {
      if (stillSignedIn()) setSaveState((current) => current.uid === user.uid ? { ...current, saving: false } : current);
    }
  }

  function retryProfile() {
    setError("");
    setProfileLoadFailed(false);
    setProfile(null);
    setProfileAttempt((attempt) => attempt + 1);
  }

  async function leaveAccount() {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      setError("We couldn't sign you out. Please retry.");
    }
  }

  return (
    <>
      {children}

      {/* Public content is already usable while anonymous auth initializes. */}
      {user && (status === "checking" || (status === "incomplete" && !showIncomplete)) ? (
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-white" aria-busy="true">
          <LoaderCircle className="size-8 animate-spin text-cmt-primary-600" aria-hidden="true" />
          <span className="sr-only">Checking your profile</span>
        </div>
      ) : null}

      {showIncomplete ? (
        <dialog
          ref={dialogRef}
          aria-labelledby="complete-profile-title"
          onCancel={(event) => event.preventDefault()}
          onClose={() => {
            if (showIncomplete) dialogRef.current?.showModal();
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-cmt-lg border-0 bg-white p-0 text-cmt-neutral-900 shadow-cmt-xl backdrop:bg-cmt-secondary-900/75"
        >
          <form onSubmit={saveProfile} className="p-6 font-body sm:p-8" noValidate>
            <span className="grid size-12 place-items-center rounded-cmt-full bg-cmt-primary-100 text-cmt-primary-900">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <h1 id="complete-profile-title" className="mt-5 font-display text-2xl font-semibold">
              {profileLoadFailed ? "Your profile couldn't load" : "Complete your profile"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-cmt-neutral-600">
              {profileLoadFailed
                ? "Retry to recover your saved details, or sign out and continue browsing."
                : "Your name, email address and phone number are required before you can continue."}
            </p>

            {error ? (
              <p role="alert" className="mt-5 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">
                {error}
              </p>
            ) : null}

            {!profileLoadFailed ? <fieldset disabled={savePending} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Full name</span>
                <span className="relative block">
                  <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" aria-hidden="true" />
                  <input autoFocus required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="h-11 w-full rounded-cmt-control border border-cmt-neutral-200 pl-10 pr-3 text-sm outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20" />
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-semibold">
                  Email address
                  {isGoogleAccount ? <span className="text-xs font-medium text-cmt-neutral-500">Verified by Google</span> : null}
                </span>
                <span className="relative block">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" aria-hidden="true" />
                  <input required type="email" autoComplete="email" value={email} readOnly={isGoogleAccount} aria-readonly={isGoogleAccount} onChange={(event) => setEmail(event.target.value)} className={`h-11 w-full rounded-cmt-control border border-cmt-neutral-200 pl-10 pr-3 text-sm outline-none ${isGoogleAccount ? "cursor-not-allowed bg-cmt-neutral-100 text-cmt-neutral-500" : "focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20"}`} />
                </span>
              </label>
              <PhoneNumberField required value={phone} onChange={setPhone} />
            </fieldset> : null}

            <button type={profileLoadFailed ? "button" : "submit"} onClick={profileLoadFailed ? retryProfile : undefined} disabled={saving} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold shadow-cmt-primary transition-colors hover:bg-cmt-primary-600 disabled:cursor-wait disabled:opacity-60">
              {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              {saving ? "Saving details…" : profileLoadFailed ? "Retry loading profile" : savePending ? "Check save again" : "Save and continue"}
            </button>
            {profileLoadFailed || saveFailed ? <button type="button" onClick={leaveAccount} className="mt-3 h-11 w-full text-sm font-semibold text-cmt-neutral-600 underline">Sign out and browse</button> : <p className="mt-3 text-center text-xs text-cmt-neutral-500">
              All fields are mandatory. Complete your profile to use CompareMyTrip.
            </p>}
          </form>
        </dialog>
      ) : null}
    </>
  );
}
