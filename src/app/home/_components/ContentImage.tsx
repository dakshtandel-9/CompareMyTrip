import Image, { type ImageProps } from "next/image";

/* next/image, but tolerant of the two things the CRM can hand it that the
   plain component cannot take: an uploaded data URL, which the optimiser has
   no way to fetch, and a cleared field, whose empty src throws. A cleared
   photo renders nothing and leaves its container's own background showing. */
export default function ContentImage({ src, alt, ...rest }: ImageProps) {
  if (typeof src !== "string" || src.length === 0) return null;

  /* Known storage hosts are allow-listed in next.config and should keep
     Next's responsive optimization. Arbitrary editor-pasted hosts remain
     unoptimized so an otherwise valid content update cannot break rendering. */
  let bypassOptimizer = src.startsWith("data:");
  if (/^https?:\/\//i.test(src)) {
    try {
      const hostname = new URL(src).hostname;
      const configuredHost =
        hostname === "xlmpzwkmxtabihhmgzhi.supabase.co" ||
        hostname === "firebasestorage.googleapis.com" ||
        hostname === "storage.googleapis.com" ||
        hostname.endsWith(".r2.dev");
      bypassOptimizer = !configuredHost;
    } catch {
      bypassOptimizer = true;
    }
  }

  return <Image src={src} alt={alt} unoptimized={bypassOptimizer} {...rest} />;
}
