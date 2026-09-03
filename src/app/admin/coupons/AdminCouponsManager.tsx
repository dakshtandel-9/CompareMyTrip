"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Check,
  Pencil,
  Plus,
  Search,
  TicketPercent,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import {
  BLANK_COUPON,
  couponHeadline,
  normaliseCode,
  type Coupon,
  type CouponType,
} from "@/lib/coupons";
import { deleteCoupon, saveCoupon, subscribeToCoupons } from "@/lib/firebase/coupons";
import { subscribeToTrips, type Trip } from "@/lib/firebase/trips";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { DUMMY_PACKAGES } from "@/lib/packageData";
import { NumberField } from "../_components/EditorParts";
import {
  Button,
  Card,
  FieldLabel,
  SegmentedControl,
  TextField,
  Toggle,
  inputClass,
} from "../_components/ui";

/* ------------------------------------------------------------------ */
/* Coupons.                                                            */
/*                                                                     */
/* Everything a code does is decided here and nowhere else: how much it  */
/* takes off, what it takes it off, who may use it, how often, between   */
/* which dates, and whether the traveller has to type it at all.         */
/*                                                                      */
/* "Used" counts settled bookings, read live from `trips`, rather than a */
/* counter kept on the coupon — a failed payment or a replayed gateway   */
/* callback can then never inflate it, and the number here is the same   */
/* one the checkout enforces its limits against.                         */
/* ------------------------------------------------------------------ */

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function AdminCouponsManager() {
  const authUser = useAuthUser();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [draft, setDraft] = useState<Coupon | null>(null);
  /* The code the draft started life with, so renaming one does not leave
     the old document behind. Empty for a new coupon. */
  const [editingCode, setEditingCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authUser) return;
    const stop = subscribeToCoupons(
      (next) => {
        setCoupons(next);
        setLoading(false);
        setLoadError("");
      },
      (reason) => {
        setLoadError(reason);
        setLoading(false);
      },
    );
    return stop;
  }, [authUser]);

  /* Redemptions. A CRM account can already read every trip, so this is the
     same data the trips screen shows, counted by code. */
  useEffect(() => {
    if (!authUser) return;
    return subscribeToTrips(setTrips, () => setTrips([]));
  }, [authUser]);

  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const trip of trips) {
      if (!trip.couponCode || trip.paymentStatus !== "successful") continue;
      counts.set(trip.couponCode, (counts.get(trip.couponCode) ?? 0) + 1);
    }
    return counts;
  }, [trips]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return coupons;
    return coupons.filter(
      (coupon) =>
        coupon.code.toLowerCase().includes(needle) ||
        coupon.label.toLowerCase().includes(needle),
    );
  }, [coupons, search]);

  const liveCount = coupons.filter((coupon) => coupon.active).length;

  const startNew = () => {
    setDraft({ ...BLANK_COUPON });
    setEditingCode("");
    setError("");
    setMessage("");
  };

  const startEdit = (coupon: Coupon) => {
    setDraft({ ...coupon });
    setEditingCode(coupon.code);
    setError("");
    setMessage("");
  };

  const handleSave = async () => {
    if (!draft) return;
    const code = normaliseCode(draft.code);
    if (!code) return setError("A coupon needs a code.");
    if (draft.type === "percent" && draft.percentOff <= 0) {
      return setError("A percentage coupon needs a percentage above zero.");
    }
    if (draft.type === "flat" && draft.flatOff <= 0) {
      return setError("A flat coupon needs an amount above zero.");
    }
    /* Renaming onto a code that already exists would silently replace it. */
    if (code !== editingCode && coupons.some((coupon) => coupon.code === code)) {
      return setError(`${code} already exists — edit that coupon instead.`);
    }

    setSaving(true);
    setError("");
    try {
      await saveCoupon({ ...draft, code }, editingCode);
      setMessage(`${code} saved.`);
      setDraft(null);
      setEditingCode("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That coupon could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    const used = usage.get(coupon.code) ?? 0;
    const warning = used
      ? `${coupon.code} has been used on ${used} paid ${used === 1 ? "booking" : "bookings"}. Those bookings keep their record, but the code stops working. Delete it?`
      : `Delete ${coupon.code}?`;
    if (!window.confirm(warning)) return;

    setError("");
    setMessage("");
    try {
      await deleteCoupon(coupon.code);
      setMessage(`${coupon.code} deleted.`);
      if (editingCode === coupon.code) {
        setDraft(null);
        setEditingCode("");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That coupon could not be deleted.");
    }
  };

  const displayError =
    authUser === null ? "Sign in to your CRM account to manage coupons." : error || loadError;

  return (
    <div className="font-body text-cmt-neutral-900">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">
            Offers
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Coupons
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">
            Codes travellers can enter at checkout, and the standing offers that
            apply themselves. The discount is worked out on the server at
            payment time, so what is set here is what gets charged.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[170px] items-center gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white px-4 py-3 shadow-cmt-xs">
            <span className="grid size-10 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900">
              <TicketPercent className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {loading ? "—" : `${liveCount}/${coupons.length}`}
              </p>
              <p className="text-xs text-cmt-neutral-500">Active coupons</p>
            </div>
          </div>
          <Button onClick={startNew} disabled={authUser === null} className="h-11">
            <Plus className="size-4" /> New coupon
          </Button>
        </div>
      </header>

      {displayError ? (
        <p
          role="alert"
          className="mt-6 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700"
        >
          {displayError}
        </p>
      ) : null}

      {message && !displayError ? (
        <p className="mt-6 rounded-cmt-control border border-cmt-success-500/20 bg-cmt-success-100 px-4 py-3 text-sm text-cmt-success-700">
          {message}
        </p>
      ) : null}

      {draft && (
        <div className="mt-7">
          <CouponEditor
            draft={draft}
            isNew={editingCode === ""}
            saving={saving}
            onChange={setDraft}
            onSave={() => void handleSave()}
            onCancel={() => {
              setDraft(null);
              setEditingCode("");
            }}
          />
        </div>
      )}

      <section className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cmt-neutral-200 px-5 py-4">
          <p className="text-sm font-semibold">
            {loading
              ? "Loading coupons…"
              : `${visible.length} ${visible.length === 1 ? "coupon" : "coupons"}`}
          </p>
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search coupons</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code or name"
              className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 pl-9 pr-3 text-sm outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20"
            />
          </label>
        </div>

        <div className="divide-y divide-cmt-neutral-200">
          {visible.map((coupon) => (
            <CouponRow
              key={coupon.code}
              coupon={coupon}
              used={usage.get(coupon.code) ?? 0}
              editing={editingCode === coupon.code}
              disabled={authUser === null}
              onEdit={() => startEdit(coupon)}
              onDelete={() => void handleDelete(coupon)}
            />
          ))}

          {!loading && !displayError && visible.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <TicketPercent className="mx-auto size-8 text-cmt-neutral-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">
                {coupons.length ? "No coupon matches your search" : "No coupons yet"}
              </p>
              <p className="mt-1 text-xs text-cmt-neutral-500">
                {coupons.length
                  ? "Try the code itself."
                  : "Create one and it works at checkout straight away."}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------- Row ------------------------------ */

function CouponRow({
  coupon,
  used,
  editing,
  disabled,
  onEdit,
  onDelete,
}: {
  coupon: Coupon;
  used: number;
  editing: boolean;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const window_ =
    coupon.startsOn && coupon.endsOn
      ? `${coupon.startsOn} → ${coupon.endsOn}`
      : coupon.startsOn
        ? `From ${coupon.startsOn}`
        : coupon.endsOn
          ? `Until ${coupon.endsOn}`
          : "No end date";

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 px-5 py-4 ${
        editing ? "bg-cmt-primary-50/50" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-cmt-sm border border-dashed border-cmt-primary-700 bg-cmt-primary-50 px-2 py-0.5 font-mono text-[13px] font-semibold tracking-[0.06em]">
            {coupon.code}
          </span>
          <Pill tone={coupon.active ? "good" : "muted"}>
            {coupon.active ? "Active" : "Paused"}
          </Pill>
          {coupon.autoApply && <Pill tone="info">Auto-applied</Pill>}
          {coupon.firstBookingOnly && <Pill tone="info">First booking</Pill>}
        </div>

        <p className="mt-1.5 text-sm font-semibold">{coupon.label || couponHeadline(coupon)}</p>
        <p className="mt-0.5 text-xs text-cmt-neutral-500">
          {couponHeadline(coupon)} · {window_} ·{" "}
          {coupon.packageIds.length === 0
            ? "All packages"
            : `${coupon.packageIds.length} ${coupon.packageIds.length === 1 ? "package" : "packages"}`}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-display text-lg font-semibold tabular-nums">
            {used}
            {coupon.usageLimit > 0 ? (
              <span className="text-sm font-medium text-cmt-neutral-400">/{coupon.usageLimit}</span>
            ) : null}
          </p>
          <p className="text-[11px] text-cmt-neutral-500">Redeemed</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onEdit} disabled={disabled}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={disabled}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "good" | "info" | "muted";
}) {
  const styles = {
    good: "border-cmt-success-500/30 bg-cmt-success-100 text-cmt-success-700",
    info: "border-cmt-neutral-200 bg-cmt-neutral-100 text-cmt-neutral-600",
    muted: "border-cmt-neutral-200 bg-white text-cmt-neutral-500",
  }[tone];

  return (
    <span className={`rounded-cmt-full border px-2 py-0.5 text-[11px] font-semibold ${styles}`}>
      {children}
    </span>
  );
}

/* ------------------------------ Editor ---------------------------- */

const TYPE_OPTIONS: { value: CouponType; label: string }[] = [
  { value: "percent", label: "Percentage off" },
  { value: "flat", label: "Flat amount off" },
];

function CouponEditor({
  draft,
  isNew,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Coupon;
  isNew: boolean;
  saving: boolean;
  onChange: (next: Coupon) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [packageSearch, setPackageSearch] = useState("");
  const patch = (changes: Partial<Coupon>) => onChange({ ...draft, ...changes });

  const packages = useMemo(() => {
    const needle = packageSearch.trim().toLowerCase();
    if (!needle) return DUMMY_PACKAGES;
    return DUMMY_PACKAGES.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.destination.toLowerCase().includes(needle),
    );
  }, [packageSearch]);

  const togglePackage = (id: string) =>
    patch({
      packageIds: draft.packageIds.includes(id)
        ? draft.packageIds.filter((entry) => entry !== id)
        : [...draft.packageIds, id],
    });

  return (
    <div className="space-y-5">
      <Card
        icon={<TicketPercent className="size-5" />}
        title={isNew ? "New coupon" : `Editing ${draft.code || "coupon"}`}
        description="The code as travellers type it, and the discount behind it."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>
              <X className="size-4" /> Cancel
            </Button>
            <Button onClick={onSave} disabled={saving}>
              <Check className="size-4" /> {saving ? "Saving…" : "Save coupon"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Code"
            value={draft.code}
            onChange={(code) => patch({ code: normaliseCode(code) })}
            placeholder="MONSOON12"
            hint="Letters, numbers, - and _. Case does not matter at checkout."
          />
          <TextField
            label="Name"
            value={draft.label}
            onChange={(label) => patch({ label })}
            placeholder="Monsoon campaign"
            hint="Shown to the traveller under the applied code."
          />
        </div>

        <div className="mt-5">
          <SegmentedControl
            label="Discount type"
            value={draft.type}
            options={TYPE_OPTIONS}
            onChange={(type) => patch({ type })}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {draft.type === "percent" ? (
            <>
              <NumberField
                label="Percent off"
                value={draft.percentOff}
                onChange={(percentOff) => patch({ percentOff })}
                min={0}
                max={100}
                hint="Of the order total, before any fees."
              />
              <NumberField
                label="Maximum discount (₹)"
                value={draft.maxDiscount}
                onChange={(maxDiscount) => patch({ maxDiscount })}
                hint="The ceiling on a percentage — 0 for no cap."
              />
            </>
          ) : (
            <NumberField
              label="Amount off (₹)"
              value={draft.flatOff}
              onChange={(flatOff) => patch({ flatOff })}
              hint="Taken straight off the total."
            />
          )}

          <NumberField
            label="Minimum order value (₹)"
            value={draft.minOrderValue}
            onChange={(minOrderValue) => patch({ minOrderValue })}
            hint="The order must reach this. 0 for no floor."
          />
        </div>

        <p className="mt-5 rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 px-4 py-3 text-sm">
          <span className="font-semibold">At checkout: </span>
          <span className="text-cmt-neutral-600">{couponHeadline(draft)}</span>
        </p>
      </Card>

      <Card
        icon={<Wand2 className="size-5" />}
        title="How it is claimed"
        description="Whether travellers have to type it, and who it is for."
      >
        <div className="space-y-3">
          <Toggle
            label="Active"
            description={
              draft.active
                ? "Accepted at checkout, subject to the rules below."
                : "Refused at checkout, whatever else is set here."
            }
            checked={draft.active}
            onChange={(active) => patch({ active })}
          />
          <Toggle
            label="Apply automatically"
            description={
              draft.autoApply
                ? "Applied for every order that qualifies, without the code being typed. Where two auto offers fit, the traveller gets the bigger one."
                : "The traveller has to enter the code."
            }
            checked={draft.autoApply}
            onChange={(autoApply) => patch({ autoApply })}
          />
          <Toggle
            label="First booking only"
            description={
              draft.firstBookingOnly
                ? "Only for travellers with no paid booking yet — matched on their account and their email."
                : "Any traveller may use it."
            }
            checked={draft.firstBookingOnly}
            onChange={(firstBookingOnly) => patch({ firstBookingOnly })}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DateField
            label="Starts on"
            value={draft.startsOn}
            onChange={(startsOn) => patch({ startsOn })}
            hint="Empty starts it straight away. Indian dates."
          />
          <DateField
            label="Ends on"
            value={draft.endsOn}
            onChange={(endsOn) => patch({ endsOn })}
            hint="Empty leaves it open-ended. The last day counts."
          />
          <NumberField
            label="Total redemptions"
            value={draft.usageLimit}
            onChange={(usageLimit) => patch({ usageLimit })}
            hint="Across everyone. 0 for unlimited."
          />
          <NumberField
            label="Per traveller"
            value={draft.perUserLimit}
            onChange={(perUserLimit) => patch({ perUserLimit })}
            hint="Paid bookings one traveller may use it on. 0 for unlimited."
          />
        </div>
      </Card>

      <Card
        icon={<BadgePercent className="size-5" />}
        title={
          draft.packageIds.length === 0
            ? "Packages — all of them"
            : `Packages — ${draft.packageIds.length} selected`
        }
        description="Leave everything unticked and the code works on any package that can be paid for online."
        action={
          draft.packageIds.length > 0 ? (
            <Button variant="ghost" onClick={() => patch({ packageIds: [] })}>
              Clear selection
            </Button>
          ) : undefined
        }
      >
        <label className="relative block">
          <span className="sr-only">Search packages</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={packageSearch}
            onChange={(event) => setPackageSearch(event.target.value)}
            placeholder="Search packages"
            className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 pl-9 pr-3 text-sm outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20"
          />
        </label>

        <div className="mt-3 max-h-72 overflow-y-auto rounded-cmt-control border border-cmt-neutral-200">
          {packages.map((item) => {
            const checked = draft.packageIds.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-center justify-between gap-3 border-b border-cmt-neutral-100 px-4 py-2.5 last:border-b-0 hover:bg-cmt-neutral-50"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePackage(item.id)}
                    className="size-4 shrink-0 accent-cmt-primary-500"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block text-[11px] text-cmt-neutral-500">
                      {item.destination} · {formatINR(item.price)} per person
                    </span>
                  </span>
                </span>
              </label>
            );
          })}

          {packages.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-cmt-neutral-500">
              No package matches that search.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

/** A calendar day, kept as YYYY-MM-DD — the same shape the coupon rules
    compare against, so nothing has to parse a locale. */
function DateField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
      {hint && <span className="mt-1 block text-[11px] text-cmt-neutral-500">{hint}</span>}
    </label>
  );
}
