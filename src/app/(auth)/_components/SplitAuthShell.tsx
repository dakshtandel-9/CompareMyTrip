import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function SplitAuthShell({
  navPrompt,
  title,
  subtitle,
  children,
  legalText,
  imageSrc,
  imageAlt,
  headline,
  imageSubcopy,
  imagePanelBottom,
}: {
  navPrompt: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  legalText?: ReactNode;
  imageSrc: string;
  imageAlt: string;
  headline: ReactNode;
  imageSubcopy: string;
  imagePanelBottom: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh w-full lg:h-screen font-body lg:grid-cols-2">
      {/* Form column — 50% width on desktop, full height, scrolls internally if content is taller than the viewport */}
      <div className="flex min-w-0 flex-col bg-cmt-white px-4 py-5 lg:h-full lg:overflow-y-auto sm:px-10 sm:py-6 lg:px-14 lg:py-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="CompareMyTrip"
              width={1400}
              height={167}
              fetchPriority="high"
              className="h-auto w-[190px] max-w-full sm:h-6 sm:w-auto lg:h-7"
            />
          </Link>
          <p className="text-[14px] text-cmt-neutral-500">{navPrompt}</p>
        </div>

        <div className="mx-auto w-full max-w-[400px] pt-5">
          <h1 className="font-display text-[26px] font-bold leading-[1.2] tracking-[-0.005em] text-cmt-neutral-900 lg:text-[30px]">
            {title}
          </h1>
          <p className="mt-1.5 text-[14px] leading-[1.5] text-cmt-neutral-500">{subtitle}</p>

          <div className="mt-5">{children}</div>
        </div>

        {legalText ? (
          <p className="mx-auto mt-auto w-full max-w-[400px] pt-4 text-center text-[12px] leading-[1.5] text-cmt-neutral-500">
            {legalText}
          </p>
        ) : null}
      </div>

      {/* Image column — 50% width on desktop, full viewport height, edge to edge */}
      <div className="relative hidden h-full overflow-hidden lg:block">
        <Image src={imageSrc} alt={imageAlt} fill fetchPriority="high" className="object-cover" sizes="50vw" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-cmt-neutral-900/90 via-cmt-neutral-900/10 to-cmt-neutral-900/20"
        />

        <div className="absolute inset-x-8 bottom-8 flex flex-col gap-6">
          <div>
            <h2 className="font-display text-[34px] font-bold leading-[1.1] tracking-[-0.01em] text-cmt-white">
              {headline}
            </h2>
            <p className="mt-3 max-w-[380px] text-[15px] leading-[1.6] text-cmt-neutral-300">
              {imageSubcopy}
            </p>
          </div>

          {imagePanelBottom}
        </div>
      </div>
    </main>
  );
}
