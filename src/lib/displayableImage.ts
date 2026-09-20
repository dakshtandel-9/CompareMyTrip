/* ------------------------------------------------------------------ */
/* Whether a value is ready to hand to next/image.                      */
/*                                                                      */
/* Image URLs are typed by hand in the CRM, so a field holds partial    */
/* text on the way to a real address — "h", "https:/", "htt". Those are */
/* non-empty but parse as neither an absolute URL nor a root-relative   */
/* path, and next/image throws while resolving them. Callers show a     */
/* placeholder until the value becomes loadable.                        */
/* ------------------------------------------------------------------ */

export function isDisplayableImage(value: string | undefined | null): value is string {
  const src = value?.trim();
  if (!src) return false;
  if (src.startsWith("data:") || src.startsWith("blob:")) return true;
  if (src.startsWith("/")) return true;
  if (!/^https?:\/\//i.test(src)) return false;
  try {
    return Boolean(new URL(src).hostname);
  } catch {
    return false;
  }
}

/** Remote and inline sources skip the optimiser: arbitrary hosts are not allow-listed. */
export function bypassesImageOptimizer(src: string): boolean {
  return /^(data:|blob:|https?:)/i.test(src.trim());
}
