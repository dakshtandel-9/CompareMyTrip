import Image, { type ImageProps } from "next/image";

/* next/image for the public site. A lazy photo stays transparent until it has
   fully arrived and then fades in, instead of painting in strips one card at
   a time; its container's background shows meanwhile. The fade is CSS
   (globals.css) driven by the inline script in the root layout, which marks
   images as they load, so it never waits for React to hydrate.

   Preloaded, eager and high-priority images are the first screen and are
   left to paint as soon as they can. The script adds `data-loaded` before
   hydration, hence suppressHydrationWarning. */
export default function SiteImage({ alt, ...props }: ImageProps) {
  const firstScreen = props.preload || props.loading === "eager" || props.fetchPriority === "high";
  return <Image alt={alt} {...props} data-reveal={firstScreen ? undefined : ""} suppressHydrationWarning />;
}

/* Marks every image as it finishes loading (or fails, so its alt text still
   shows), then flags the page so the hide-until-loaded CSS applies only where
   this has run: without it, images simply paint as they arrive. Rendered first
   in <body>, so the listener is in place before any image is parsed. */
const MARK_LOADED_IMAGES = `(function(d){function mark(e){var t=e.target;if(t&&t.tagName==="IMG")t.setAttribute("data-loaded","")}d.addEventListener("load",mark,true);d.addEventListener("error",mark,true);d.documentElement.setAttribute("data-image-reveal","")})(document)`;

export function ImageRevealScript() {
  return <script dangerouslySetInnerHTML={{ __html: MARK_LOADED_IMAGES }} />;
}
