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
  todayInIndia,
  type Coupon,
  type CouponType,
} from "@/lib/coupons";
import { deleteCoupon, saveCoupon, subscribeToCoupons } from "@/lib/firebase/coupons";
import { subscribeToTrips, type Trip } from "@/lib/firebase/trips";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useAllPackagesState } from "@/lib/usePackages";
import { InboxFilters, InboxSearch, InboxState, OperationsHeader, WorkflowGuide } from "../enquiries/OperationsUI";
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

function couponAvailability(coupon: Coupon, used: number | null, today: string) {
  if (!coupon.active) return "Paused";
  if (coupon.endsOn && coupon.endsOn < today) return "Expired";
  if (coupon.startsOn && coupon.startsOn > today) return "Scheduled";
  if (coupon.usageLimit > 0 && used === null) return "Usage unavailable";
  if (coupon.usageLimit > 0 && used !== null && used >= coupon.usageLimit) return "Fully used";
  return "Available";
}


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
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingCode, setDeletingCode] = useState("");
  const [usageError, setUsageError] = useState("");
  const [usageLoading, setUsageLoading] = useState(true);
  const [today, setToday] = useState(() => todayInIndia());

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
    return subscribeToTrips(next => { setTrips(next); setUsageError(""); setUsageLoading(false); }, () => { setUsageError("Booking usage counts could not be loaded. Refresh the page to try again."); setUsageLoading(false); });
  }, [authUser]);

  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const trip of trips) {
      if (!trip.couponCode || trip.paymentStatus !== "successful") continue;
      counts.set(trip.couponCode, (counts.get(trip.couponCode) ?? 0) + 1);
    }
    return counts;
  }, [trips]);

  useEffect(() => {
    const timer = setInterval(() => setToday(todayInIndia()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const availability = (coupon: Coupon) => couponAvailability(coupon, usageLoading || usageError ? null : usage.get(coupon.code) ?? 0, today);
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return coupons.filter(coupon => {
      const status = couponAvailability(coupon, usageLoading || usageError ? null : usage.get(coupon.code) ?? 0, today);
      const matchesStatus = statusFilter === "all" || (statusFilter === "available" ? status === "Available" : statusFilter === "scheduled" ? status === "Scheduled" : statusFilter === "check" ? status === "Usage unavailable" : status === "Paused" || status === "Expired" || status === "Fully used");
      return matchesStatus && (!needle || coupon.code.toLowerCase().includes(needle) || coupon.label.toLowerCase().includes(needle));
    });
  }, [coupons, search, statusFilter, today, usage, usageError, usageLoading]);

  const liveCount = coupons.filter(coupon => availability(coupon) === "Available").length;
  const scheduledCount = coupons.filter(coupon => availability(coupon) === "Scheduled").length;
  const unknownCount = coupons.filter(coupon => availability(coupon) === "Usage unavailable").length;
  const isLoading = authUser === undefined || (authUser !== null && loading);
  const discardDraft = () => !draft || JSON.stringify(draft) === JSON.stringify(editingCode ? coupons.find(coupon => coupon.code === editingCode) : BLANK_COUPON) || window.confirm("Discard your unsaved coupon changes?");

  const startNew = () => {
    if (saving || !discardDraft()) return;
    setDraft({ ...BLANK_COUPON });
    setEditingCode("");
    setError("");
    setMessage("");
    requestAnimationFrame(() => document.getElementById("coupon-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const startEdit = (coupon: Coupon) => {
    if (saving || !discardDraft()) return;
    setDraft({ ...coupon });
    setEditingCode(coupon.code);
    setError("");
    setMessage("");
    requestAnimationFrame(() => document.getElementById("coupon-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const handleSave = async () => {
    if (!draft || saving) return;
    const code = normaliseCode(draft.code);
    if (!code) return setError("A coupon needs a code.");
    if (draft.type === "percent" && (draft.percentOff <= 0 || draft.percentOff > 100)) {
      return setError("Enter a discount percentage greater than 0 and no more than 100.");
    }
    if (draft.type === "flat" && draft.flatOff <= 0) {
      return setError("A flat coupon needs an amount above zero.");
    }
    if (draft.startsOn && draft.endsOn && draft.endsOn < draft.startsOn) {
      return setError("The end date must be on or after the start date.");
    }
    if ([draft.percentOff, draft.flatOff, draft.maxDiscount, draft.minOrderValue, draft.usageLimit, draft.perUserLimit].some(value => !Number.isFinite(value) || value < 0)) {
      return setError("Discount amounts and usage limits must be zero or greater.");
    }
    if (!Number.isInteger(draft.usageLimit) || !Number.isInteger(draft.perUserLimit)) {
      return setError("Usage limits must be whole numbers. Use 0 for unlimited.");
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
    setDeletingCode(coupon.code);
    try {
      await deleteCoupon(coupon.code);
      setMessage(`${coupon.code} deleted.`);
      if (editingCode === coupon.code) {
        setDraft(null);
        setEditingCode("");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That coupon could not be deleted.");
    } finally {
      setDeletingCode("");
    }
  };

  const displayError =
    authUser === null ? "Sign in to your admin account to manage coupons." : error || loadError;

  return (
    <div className="font-body text-cmt-neutral-900">
      <OperationsHeader eyebrow="Offers & discounts" title="Discount coupons"
        description="Create offers for your customers, choose where they apply, and keep track of how often they are used."
        action={<Button onClick={startNew} disabled={!authUser || saving} className="h-11"><Plus className="size-4" aria-hidden="true" />Create coupon</Button>}
        metrics={[
          { label: "Available coupons", value: isLoading || usageLoading || usageError ? "—" : liveCount, hint: "Enabled and within their dates and limits", attention: true },
          { label: "Scheduled offers", value: isLoading ? "—" : scheduledCount, hint: "Offers that start on a future date" },
          { label: "Successful uses", value: isLoading || usageLoading || usageError ? "—" : Array.from(usage.values()).reduce((sum, count) => sum + count, 0), hint: "Coupon uses on paid bookings" },
        ]} />
      <WorkflowGuide steps={["Set the discount", "Choose dates, customers and packages", "Save the coupon to make it available"]} />
      {usageError && <p role="alert" className="my-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{usageError}</p>}

      {displayError ? (
        <p
          role="alert"
          className="mt-6 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700"
        >
          {displayError}
        </p>
      ) : null}

      {message && !displayError ? (
        <p role="status" className="mt-6 rounded-cmt-control border border-cmt-success-500/20 bg-cmt-success-100 px-4 py-3 text-sm text-cmt-success-700">
          {message}
        </p>
      ) : null}

      {draft && (
        <div className="mt-7 scroll-mt-24" id="coupon-editor">
          <CouponEditor
            draft={draft}
            isNew={editingCode === ""}
            saving={saving}
            error={error}
            onChange={setDraft}
            onSave={() => void handleSave()}
            onCancel={() => {
              if (saving || !discardDraft()) return;
              setDraft(null);
              setEditingCode("");
            }}
          />
        </div>
      )}

      <section className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
        <div className="space-y-4 border-b border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Your coupons</h2><p className="mt-1 text-xs text-slate-500">{isLoading ? "Loading coupons…" : `${visible.length} of ${coupons.length} coupons`}</p></div><InboxSearch value={search} onChange={setSearch} placeholder="Search coupon code or offer name" label="Search coupons" /></div>
          <InboxFilters value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "All coupons", count: coupons.length }, { value: "available", label: "Available", count: liveCount }, { value: "scheduled", label: "Scheduled", count: scheduledCount }, { value: "inactive", label: "Paused or finished", count: coupons.length - liveCount - scheduledCount - unknownCount }, ...(unknownCount ? [{ value: "check", label: "Check usage", count: unknownCount }] : [])]} />
        </div>

        <div className="divide-y divide-cmt-neutral-200">
          {visible.map((coupon) => (
            <CouponRow
              key={coupon.code}
              coupon={coupon}
              used={usage.get(coupon.code) ?? 0}
              editing={editingCode === coupon.code}
              disabled={!authUser || saving || Boolean(deletingCode)}
              availability={availability(coupon)}
              usageUnavailable={usageLoading || Boolean(usageError)}
              onEdit={() => startEdit(coupon)}
              onDelete={() => void handleDelete(coupon)}
            />
          ))}

          <InboxState loading={isLoading} empty={!displayError && visible.length === 0} title={coupons.length ? "No coupons match your filters" : "Create your first coupon"} description={coupons.length ? "Search by code or offer name, or clear the filters." : "Choose Create coupon to set up a discount for your customers."} onReset={search || statusFilter !== "all" ? () => { setSearch(""); setStatusFilter("all"); } : undefined} />
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
  availability,
  usageUnavailable,
  onEdit,
  onDelete,
}: {
  coupon: Coupon;
  used: number;
  editing: boolean;
  disabled: boolean;
  availability: string;
  usageUnavailable: boolean;
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
          <Pill tone={availability === "Available" ? "good" : "muted"}>
            {availability}
          </Pill>
          {coupon.autoApply && <Pill tone="info">Applied automatically</Pill>}
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
            {usageUnavailable ? "—" : used}
            {coupon.usageLimit > 0 && !usageUnavailable ? (
              <span className="text-sm font-medium text-cmt-neutral-400">/{coupon.usageLimit}</span>
            ) : null}
          </p>
          <p className="text-[11px] text-cmt-neutral-500">{usageUnavailable ? "Usage unavailable" : "Paid bookings"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onEdit} disabled={disabled}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={disabled}>
            <Trash2 className="size-4" /> Delete
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
  error,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Coupon;
  isNew: boolean;
  saving: boolean;
  error: string;
  onChange: (next: Coupon) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [packageSearch, setPackageSearch] = useState("");
  const catalogue = useAllPackagesState();
  const patch = (changes: Partial<Coupon>) => onChange({ ...draft, ...changes });

  const packages = useMemo(() => {
    const needle = packageSearch.trim().toLowerCase();
    if (!needle) return catalogue.packages;
    return catalogue.packages.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.destination.toLowerCase().includes(needle),
    );
  }, [packageSearch, catalogue.packages]);

  const togglePackage = (id: string) =>
    patch({
      packageIds: draft.packageIds.includes(id)
        ? draft.packageIds.filter((entry) => entry !== id)
        : [...draft.packageIds, id],
    });

  return (
    <fieldset disabled={saving} className="min-w-0 space-y-5">
      <Card
        icon={<TicketPercent className="size-5" />}
        title={isNew ? "1. Create your discount" : `1. Edit ${draft.code || "coupon"}`}
        description="Choose the code customers will use and how much they will save."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
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
            label="Coupon code"
            value={draft.code}
            onChange={(code) => patch({ code: normaliseCode(code) })}
            placeholder="MONSOON12"
            hint="For example, SUMMER10. Letters, numbers, hyphens and underscores are allowed."
          />
          <TextField
            label="Offer name"
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
                hint="Maximum saving on one booking. Enter 0 for no limit."
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
            hint="The minimum booking amount needed to use this coupon. Enter 0 for no minimum."
          />
        </div>

        <p className="mt-5 rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 px-4 py-3 text-sm">
          <span className="font-semibold">At checkout: </span>
          <span className="text-cmt-neutral-600">{couponHeadline(draft)}</span>
        </p>
      </Card>

      <Card
        icon={<Wand2 className="size-5" />}
        title="2. Set availability & usage limits"
        description="Choose when the offer runs, who can use it, and how often."
      >
        <div className="space-y-3">
          <Toggle
            label="Enable this coupon"
            description={
              draft.active
                ? "Customers can use this coupon when they meet the conditions below."
                : "This coupon is paused. Customers cannot use it until you turn it on."
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
            hint="Leave empty to start immediately. Dates use India time."
          />
          <DateField
            label="Ends on"
            value={draft.endsOn}
            onChange={(endsOn) => patch({ endsOn })}
            hint="Leave empty for no end date. The offer includes the entire last day."
          />
          <NumberField
            label="Maximum uses across all customers"
            value={draft.usageLimit}
            onChange={(usageLimit) => patch({ usageLimit })}
            hint="Only paid bookings count. Enter 0 for unlimited uses."
          />
          <NumberField
            label="Maximum uses per customer"
            value={draft.perUserLimit}
            onChange={(perUserLimit) => patch({ perUserLimit })}
            hint="Enter 1 for a single use per customer, or 0 for unlimited."
          />
        </div>
      </Card>

      <Card
        icon={<BadgePercent className="size-5" />}
        title={
          draft.packageIds.length === 0
            ? "3. Choose packages · all packages"
            : `3. Choose packages · ${draft.packageIds.length} selected`
        }
        description="No selection means all packages. Select one or more packages to limit the offer to those trips."
        action={
          draft.packageIds.length > 0 ? (
            <Button variant="ghost" onClick={() => patch({ packageIds: [] })}>
              Apply to all packages
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

        {catalogue.error && <p role="alert" className="mt-3 text-sm text-red-700">Packages could not be loaded: {catalogue.error}</p>}
        {catalogue.loading && <p role="status" className="mt-3 text-sm text-slate-500">Loading your package catalogue…</p>}
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
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg">
        <div><p className="text-sm font-semibold">Ready to save {draft.code || "your coupon"}?</p><p className="mt-1 text-xs text-slate-500">{draft.active ? "The offer will follow the dates and rules you selected." : "This coupon will be saved as paused."}</p></div>
        <div className="flex gap-2"><Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button><Button onClick={onSave} disabled={saving}><Check className="size-4" aria-hidden="true" />{saving ? "Saving…" : "Save coupon"}</Button></div>
      </div>
    </fieldset>
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
