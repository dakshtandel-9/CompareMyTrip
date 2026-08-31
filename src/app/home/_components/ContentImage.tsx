import Image, { type ImageProps } from "next/image";

/* next/image, but tolerant of the two things the CRM can hand it that the
   plain component cannot take: an uploaded data URL, which the optimiser has
   no way to fetch, and a cleared field, whose empty src throws. A cleared
   photo renders nothing and leaves its container's own background showing. */
export default function ContentImage({ src, alt, ...rest }: ImageProps) {
  if (typeof src !== "string" || src.length === 0) return null;

  /* Editors can paste an image URL from any host. Sending those through
     Next's optimiser would require every possible host to be allow-listed in
     next.config, so serve user-entered remote URLs directly instead. Local
     library images still get the normal optimisation path. */
  const bypassOptimizer = src.startsWith("data:") || /^https?:\/\//i.test(src);

  return <Image src={src} alt={alt} unoptimized={bypassOptimizer} {...rest} />;
}
