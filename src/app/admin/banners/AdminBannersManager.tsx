"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ExternalLink, GalleryHorizontalEnd, RotateCcw, Save, Search, Undo2 } from "lucide-react";

import {
  BANNER_SLOTS,
  bannerFor,
  type BannerContent,
  type BannersContent,
} from "@/lib/siteContent";
import {
  BANNER_DRAFT_IMAGE_KEY_PREFIX,
  cleanupAbandonedBannerImages,
  deleteImageFromCloudflare,
} from "@/lib/cloudflareUpload";
import { saveSiteContentSection } from "@/lib/firebase/homepageContent";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useSiteContentState } from "@/lib/useSiteContent";
import { Button, Card, TextArea, TextField } from "../_components/ui";
import BannerImagePicker from "./BannerImagePicker";
import ConfirmResetDialog from "./ConfirmResetDialog";
import styles from "../content/ContentWorkspace.module.css";
import { useUnsavedContentChanges } from "../content/useUnsavedContentChanges";

/* ------------------------------------------------------------------ */
/* Banners.                                                            */
/*                                                                     */
/* Every photography masthead on the site, in one place: the one on     */
/* /destinations, the region and deals mastheads on the catalogue, and  */
/* one per weekend-trek track.                                          */
/*                                                                      */
/* They are not homepage sections and are deliberately not in the       */
/* Website content editor — they belong to several different pages, and */
/* an editor looking for "the picture on the deals page" would not      */
/* think to look under a homepage section. The list of slots is code    */
/* (siteContent → BANNER_SLOTS): an editor changes what a banner says   */
/* and shows, never where it appears, so there is no way to create one  */
/* that renders nowhere.                                                */
/*                                                                      */
/* Publishing writes only the banners slice, so it can never roll back  */
/* an edit made in the content editor since this screen loaded.         */
/* ------------------------------------------------------------------ */

export default function AdminBannersManager() {
  const authUser = useAuthUser();
  const { content, loading, error } = useSiteContentState();
  const saved = content.banners;

  /* Null until something is edited, so an untouched screen simply shows the
     live document — including a change published from another tab — without
     an effect to copy one into the other. The first edit forks it. */
  const [edits, setEdits] = useState<BannersContent | null>(null);
  const draft = edits ?? saved;

  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState(BANNER_SLOTS[0].id);
  const [query, setQuery] = useState("");
  const [failure, setFailure] = useState("");
  /* The slot whose reset is waiting to be confirmed, or null. */
  const [resettingId, setResettingId] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /* Uploaded photos, on the same terms as the package builder.        */
  /*                                                                    */
  /* An upload becomes a real object in the bucket the moment it lands, */
  /* which is before anything is published — so every upload made here  */
  /* is written to sessionStorage until it is either published or       */
  /* thrown away. Close the tab mid-edit and the next visit deletes     */
  /* what was left behind; anything that fails to delete is written     */
  /* back so the visit after that retries it.                           */
  /*                                                                    */
  /* Deleting is deliberately asymmetric. A photo uploaded in this      */
  /* session and then replaced is unreferenced rubbish, so it goes      */
  /* immediately. A photo that is already published stays until the     */
  /* replacement is published — Discard has to be able to bring it      */
  /* back, and an object nobody is looking at costs nothing to keep for */
  /* another minute.                                                    */
  /* ---------------------------------------------------------------- */
  const draftStorageKey = `${BANNER_DRAFT_IMAGE_KEY_PREFIX}all`;
  const draftImagesRef = useRef<string[]>([]);

  useEffect(() => {
    void cleanupAbandonedBannerImages().then(({ failedCount }) => {
      if (failedCount) {
        setFailure(
          `${failedCount} abandoned banner image${failedCount === 1 ? "" : "s"} could not be deleted. Cleanup will retry next time.`,
        );
      }
    });
  }, []);

  const rememberDraftImage = (image: string) => {
    draftImagesRef.current = [...new Set([...draftImagesRef.current, image])];
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draftImagesRef.current));
  };

  const forgetDraftImages = (images: string[]) => {
    draftImagesRef.current = draftImagesRef.current.filter(
      (item) => !images.includes(item),
    );
    if (draftImagesRef.current.length) {
      sessionStorage.setItem(draftStorageKey, JSON.stringify(draftImagesRef.current));
    } else {
      sessionStorage.removeItem(draftStorageKey);
    }
  };

  /* Best effort throughout: the content is already right, so an object that
     outlives its reference is untidy rather than broken, and the route
     refuses anything that is not ours anyway. */
  const deleteImages = async (images: string[]) => {
    const removable = images.filter((image) => image.startsWith("http"));
    if (removable.length === 0) return;
    await Promise.allSettled(removable.map(deleteImageFromCloudflare));
  };

  const dirty = useMemo(
    () => edits !== null && JSON.stringify(edits) !== JSON.stringify(saved),
    [edits, saved],
  );
  useUnsavedContentChanges(dirty && !publishing);

  const patch = (id: string, changes: Partial<BannerContent>) => {
    setMessage("");
    setEdits((current) => ({
      items: (current ?? saved).items.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    }));
  };

  /* Every change that can swap a photo — an upload, a library pick, a pasted
     path, Remove, Reset — goes through here, so there is exactly one place
     that decides when a photo has become rubbish. */
  const applyBanner = (id: string, changes: Partial<BannerContent>) => {
    const previous = bannerFor(draft, id).image;
    const next: BannersContent = {
      items: draft.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    };
    setMessage("");
    setEdits(next);

    /* Only this session's uploads, and only once nothing else points at
       them. A published photo waits for Publish; see the note above. */
    const isDraftUpload = draftImagesRef.current.includes(previous);
    const stillUsed = next.items.some((item) => item.image === previous);
    if (previous && isDraftUpload && !stillUsed) {
      forgetDraftImages([previous]);
      void deleteImages([previous]);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setFailure("");

    /* Worked out before the write, while `saved` is still the live document:
       anything it pointed at that the new one does not. */
    const keptImages = new Set(draft.items.map((item) => item.image));
    const replaced = saved.items
      .map((item) => item.image)
      .filter((image) => image && !keptImages.has(image));

    try {
      await saveSiteContentSection("banners", draft);
      /* Published, so no longer this screen's to clean up. */
      forgetDraftImages(draft.items.map((item) => item.image));
      void deleteImages(replaced);
      setEdits(null);
      setMessage("Banners published — they are live on the site now.");
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "The banners could not be published.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const resetSlot = BANNER_SLOTS.find((slot) => slot.id === resettingId) ?? null;

  const discard = () => {
    /* Nothing was published, so every upload made here is rubbish — except
       any the live document happens to point at already. */
    const published = new Set(saved.items.map((item) => item.image));
    const abandoned = draftImagesRef.current.filter((image) => !published.has(image));
    forgetDraftImages(abandoned);
    void deleteImages(abandoned);

    setEdits(null);
    setMessage("");
    setFailure("");
  };

  const displayError =
    authUser === null ? "Sign in to your CRM account to edit banners." : failure || error;

  const selectedSlot = BANNER_SLOTS.find((slot) => slot.id === selectedId) ?? BANNER_SLOTS[0];
  const changedIds = BANNER_SLOTS.filter((slot) => JSON.stringify(bannerFor(draft, slot.id)) !== JSON.stringify(bannerFor(saved, slot.id))).map((slot) => slot.id);
  const visibleSlots = BANNER_SLOTS.filter((slot) => `${slot.name} ${slot.where}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className={styles.workspace}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Your website</p>
          <h1>Page banners</h1>
          <p>Give each page a welcoming first impression. Choose a page, update its photo and message, then publish your changes.</p>
        </div>
        <Link href={selectedSlot.where} target="_blank" className={styles.secondaryLink}><ExternalLink className="size-4" /> View live page</Link>
      </header>

      <ol className={styles.steps} aria-label="How to update banners">
        <li><span>1</span><div><strong>Choose a page</strong><p>Every banner is linked to its own page.</p></div></li>
        <li><span>2</span><div><strong>Edit the photo & message</strong><p>See your changes in the banner preview.</p></div></li>
        <li><span>3</span><div><strong>Publish your banners</strong><p>Your updated banners appear on the website.</p></div></li>
      </ol>

      <div className={styles.saveBar}>
        <div className={styles.saveState}>
          <span className={`${styles.stateDot} ${dirty ? styles.pendingDot : ""}`} />
          <div><strong>{loading ? "Loading your banners…" : dirty ? `${changedIds.length} banner${changedIds.length === 1 ? "" : "s"} with unpublished changes` : "All banners are published"}</strong><p>Changes to all edited banners are published together.</p></div>
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={discard} disabled={!dirty || publishing}><Undo2 className="size-4" /> Discard changes</Button>
          <Button onClick={() => void publish()} disabled={!dirty || publishing || loading || authUser === null}><Save className="size-4" />{publishing ? "Publishing…" : "Publish banners"}</Button>
        </div>
      </div>

      {displayError ? (
        <p
          role="alert"
          className="mt-6 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700"
        >
          {displayError}
        </p>
      ) : null}

      {message && !displayError ? (
        <p role="status" className={styles.feedback}><Check className="size-4" />{message}</p>
      ) : null}

      <div className={`${styles.editorLayout} mt-7`}>
        <nav className={styles.sectionNav} aria-label="Choose a banner to edit">
          <label className={styles.search}><Search className="size-4" aria-hidden="true" /><input aria-label="Find a page banner" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a page…" /></label>
          <p className={styles.navDescription}>{BANNER_SLOTS.length} page banners · select one to edit</p>
          <ul className={styles.bannerList}>
            {visibleSlots.map((slot) => {
              const image = bannerFor(draft, slot.id).image;
              return <li key={slot.id}><button type="button" onClick={() => setSelectedId(slot.id)} aria-current={slot.id === selectedId ? "true" : undefined} className={styles.bannerNavButton}>
                <span className={styles.bannerThumb}>{image && <Image src={image} alt="" fill sizes="58px" unoptimized className="object-cover" />}</span>
                <span><strong>{slot.name}</strong><small>{changedIds.includes(slot.id) ? "Unpublished changes" : "Published"}</small></span>
              </button></li>;
            })}
          </ul>
          {!visibleSlots.length && <div className={styles.noResults}><strong>No pages found</strong><p>Try a destination or “India”.</p><button type="button" onClick={() => setQuery("")}>Clear search</button></div>}
        </nav>
        <fieldset disabled={publishing || loading} className="min-w-0" aria-busy={publishing || loading}>
          <legend className="sr-only">Edit {selectedSlot.name} banner</legend>
        {[selectedSlot].map((slot) => {
          const banner = bannerFor(draft, slot.id);
          const isShipped = JSON.stringify(banner) === JSON.stringify(slot.banner);
          return (
            <Card
              key={slot.id}
              icon={<GalleryHorizontalEnd className="size-5" />}
              title={slot.name}
              description={`The photo and introduction at the top of the ${slot.name.toLowerCase()} page.`}
              action={<Link href={slot.where} target="_blank" className={styles.textLink}>View live page <ExternalLink className="size-3.5" /></Link>}
            >
              {/* The photo is the preview and the preview is the photo: the
                  controls sit on the picture, and the copy below is edited
                  against the contrast it will really have. */}
              <h3 className={`${styles.bannerFieldsHeading} !mt-0`}><span>1</span> Choose a photo</h3>
              <BannerImagePicker
                value={banner.image}
                onChange={(image) => applyBanner(slot.id, { image })}
                onUploaded={rememberDraftImage}
              >
                <div className="w-full">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-cmt-primary-400">
                    {banner.eyebrow || "Small heading"}
                  </p>
                  <p className="mt-1.5 max-w-[18ch] font-display text-xl font-semibold leading-[1.15] tracking-tight text-white [text-shadow:0_3px_18px_rgba(0,0,0,0.35)] sm:text-2xl">
                    {banner.title || "Headline"}
                  </p>
                  <p className="mt-2 max-w-md text-pretty text-xs leading-relaxed text-white/75 [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]">
                    {banner.description}
                  </p>
                </div>
              </BannerImagePicker>

              <h3 className={styles.bannerFieldsHeading}><span>2</span> Write your message</h3>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
                <TextField
                  label="Small heading"
                  value={banner.eyebrow}
                  onChange={(eyebrow) => patch(slot.id, { eyebrow })}
                  placeholder="Weekend treks"
                  hint="The small line above the headline."
                />
                <TextField
                  label="Main heading"
                  value={banner.title}
                  onChange={(title) => patch(slot.id, { title })}
                  placeholder="Monsoon Treks"
                  hint="The main message visitors see first."
                />
              </div>

              <TextArea
                className="mt-4"
                label="Description"
                value={banner.description}
                onChange={(description) => patch(slot.id, { description })}
                hint="One or two short sentences introducing this page."
              />
              {!isShipped && <details className={styles.advanced}><summary>Restore the original banner</summary><div><p>Bring back the original photo and wording for this page. You can review it before publishing.</p><Button variant="ghost" onClick={() => setResettingId(slot.id)} disabled={publishing}><RotateCcw className="size-4" /> Restore original</Button></div></details>}
            </Card>
          );
        })}
        </fieldset>
      </div>

      {resetSlot && (
        <ConfirmResetDialog
          bannerName={resetSlot.name}
          onCancel={() => setResettingId(null)}
          onConfirm={() => {
            /* Through applyBanner, not patch: a reset can drop an upload
               made a moment ago, and that object has to go with it. */
            applyBanner(resetSlot.id, resetSlot.banner);
            setResettingId(null);
          }}
        />
      )}
    </div>
  );
}
