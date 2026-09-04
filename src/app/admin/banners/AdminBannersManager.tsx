"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GalleryHorizontalEnd, RotateCcw, Save, Undo2 } from "lucide-react";

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

  return (
    <div className="font-body text-cmt-neutral-900">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">
            Artwork
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Banners
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">
            The photography mastheads across the site. Change the picture and
            the wording here; where each one appears is fixed, so nothing can
            end up pointing at a page that does not exist.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[170px] items-center gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white px-4 py-3 shadow-cmt-xs">
            <span className="grid size-10 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900">
              <GalleryHorizontalEnd className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {loading ? "—" : BANNER_SLOTS.length}
              </p>
              <p className="text-xs text-cmt-neutral-500">Banners on the site</p>
            </div>
          </div>

          {dirty && (
            <Button variant="ghost" onClick={discard} disabled={publishing}>
              <Undo2 className="size-4" /> Discard
            </Button>
          )}
          <Button
            onClick={() => void publish()}
            disabled={!dirty || publishing || authUser === null}
            className="h-11"
          >
            <Save className="size-4" />
            {publishing ? "Publishing…" : dirty ? "Publish banners" : "Published"}
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

      <div className="mt-7 space-y-5">
        {BANNER_SLOTS.map((slot) => {
          const banner = bannerFor(draft, slot.id);
          const isShipped =
            JSON.stringify(banner) === JSON.stringify(slot.banner);

          return (
            <Card
              key={slot.id}
              icon={<GalleryHorizontalEnd className="size-5" />}
              title={slot.name}
              description={`Shown on ${slot.where}`}
              action={
                !isShipped ? (
                  <Button
                    variant="ghost"
                    onClick={() => setResettingId(slot.id)}
                    disabled={publishing}
                  >
                    <RotateCcw className="size-4" /> Reset to original
                  </Button>
                ) : undefined
              }
            >
              {/* The photo is the preview and the preview is the photo: the
                  controls sit on the picture, and the copy below is edited
                  against the contrast it will really have. */}
              <BannerImagePicker
                value={banner.image}
                onChange={(image) => applyBanner(slot.id, { image })}
                onUploaded={rememberDraftImage}
              >
                <div className="w-full">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-cmt-primary-400">
                    {banner.eyebrow || "Eyebrow"}
                  </p>
                  <p className="mt-1.5 max-w-[18ch] font-display text-xl font-semibold leading-[1.15] tracking-tight text-white [text-shadow:0_3px_18px_rgba(0,0,0,0.35)] sm:text-2xl">
                    {banner.title || "Headline"}
                  </p>
                  <p className="mt-2 max-w-md text-pretty text-xs leading-relaxed text-white/75 [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]">
                    {banner.description}
                  </p>
                </div>
              </BannerImagePicker>

              <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
                <TextField
                  label="Eyebrow"
                  value={banner.eyebrow}
                  onChange={(eyebrow) => patch(slot.id, { eyebrow })}
                  placeholder="Weekend treks"
                  hint="The small line above the headline."
                />
                <TextField
                  label="Headline"
                  value={banner.title}
                  onChange={(title) => patch(slot.id, { title })}
                  placeholder="Monsoon Treks"
                />
              </div>

              <TextArea
                className="mt-4"
                label="Sub-line"
                value={banner.description}
                onChange={(description) => patch(slot.id, { description })}
              />
            </Card>
          );
        })}
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
