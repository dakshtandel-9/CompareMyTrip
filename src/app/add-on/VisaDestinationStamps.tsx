import Image from "next/image";
import stamps from "./visaStamps.json";

export default function VisaDestinationStamps() {
  return (
    <section aria-labelledby="visa-brands-heading" className="mt-6 rounded-cmt-lg border border-cmt-neutral-200 bg-cmt-neutral-50 p-6 sm:p-8">
      <h3 id="visa-brands-heading" className="font-display text-xl font-semibold leading-[1.25] text-cmt-neutral-900 sm:text-2xl">
        Destinations
      </h3>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2">
        {stamps.map((stamp) => (
          <li key={stamp.src} className="min-w-0 overflow-hidden rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 py-4">
            <figure className="flex h-full flex-col items-center justify-center">
              <Image
                src={stamp.src}
                alt={stamp.alt}
                width={stamp.width}
                height={stamp.height}
                sizes="(min-width: 1024px) 220px, (min-width: 640px) 160px, 45vw"
                className="h-24 w-full max-w-48 object-contain"
              />
              <figcaption className="mt-2 text-center text-xs font-medium leading-5 text-cmt-neutral-500">
                {stamp.name}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <details className="mt-4 text-xs leading-5 text-cmt-neutral-600">
        <summary className="w-fit cursor-pointer rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cmt-primary-500">
          About these stamps &amp; image credits
        </summary>
        <p className="mt-3">
          Digitally isolated impressions from original passport stamp scans, including historical examples. Antarctica shows a Port Lockroy souvenir stamp.
        </p>
        <ul className="mt-3 space-y-2">
          {stamps.map((stamp) => (
            <li key={stamp.src}>
              <a href={stamp.source} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">{stamp.name}</a>
              {" — "}{stamp.author}{" · "}
              {stamp.licenseUrl ? (
                <a href={stamp.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{stamp.license}</a>
              ) : stamp.license}
            </li>
          ))}
        </ul>
        <p className="mt-3">Sources via Wikimedia Commons. Backgrounds removed with AI; resized and converted to transparent WebP.</p>
      </details>
    </section>
  );
}
