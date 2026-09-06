"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { useSiteContent } from "@/lib/useSiteContent";
import ContentImage from "../_components/ContentImage";

function TravelPath() {
  return (
    <svg
      viewBox="0 0 224 96"
      className="pointer-events-none absolute -top-14 left-6 hidden h-24 w-56 animate-cmt-rise [animation-delay:120ms] lg:block"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 92C54 90 92 68 124 45c28-19 56-31 74-35"
        stroke="var(--cmt-color-primary-100)"
        strokeWidth="2"
        strokeDasharray="4 8"
        strokeLinecap="round"
      />
      <g transform="translate(190 -6) rotate(8)">
        <path
          d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z"
          fill="none"
          stroke="var(--cmt-color-primary-500)"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function WhyTravelWithUs() {
  const { whyUs } = useSiteContent();
  if (!whyUs.enabled) return null;

  return (
    <section
      id="why-travel-with-us"
      className="w-full bg-[#fffcf5] px-4 py-12 sm:px-5 sm:py-16 lg:px-6 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-[1440px] gap-y-10 lg:grid-cols-12 lg:gap-x-10 xl:gap-x-14">
        <div className="lg:col-span-7">
          <header className="animate-cmt-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cmt-primary-900 sm:text-sm">
              {whyUs.eyebrow}
            </p>

            <h2 className="mt-3 max-w-[620px] font-display text-[32px] font-semibold leading-[1.15] tracking-tight text-cmt-neutral-900 sm:text-5xl">
              {whyUs.titleLine1}
              <span className="block text-cmt-primary-800">{whyUs.titleLine2}</span>
            </h2>

            <p className="mt-5 max-w-[600px] text-pretty text-base leading-[1.65] text-cmt-neutral-700 sm:text-lg">
              {whyUs.description}
            </p>
          </header>

          <div className="mt-10 grid border-y border-cmt-neutral-200 sm:grid-cols-2 sm:divide-x sm:divide-cmt-neutral-200 lg:mt-12">
            {whyUs.points.map((proof, index) => (
              <article
                key={proof.id}
                className={`animate-cmt-rise relative py-6 sm:px-6 sm:py-7 ${
                  index % 2 === 0 ? "sm:pl-0" : "sm:pr-0"
                } ${index < whyUs.points.length - 1 ? "border-b border-cmt-neutral-200" : ""} ${
                  index === whyUs.points.length - 2 ? "sm:border-b-0" : ""
                }`}
                style={{ animationDelay: `${(index + 1) * 80}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-cmt-primary-500 text-cmt-neutral-900">
                    <Check className="size-3.5" strokeWidth={2.75} />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-neutral-500">
                    {proof.label}
                  </p>
                </div>

                <p className="mt-4 font-display text-[2rem] font-semibold leading-none tracking-tight text-cmt-neutral-900 sm:text-[2.35rem]">
                  {proof.value}
                </p>

                <p className="mt-3 max-w-[290px] text-sm leading-6 text-cmt-neutral-600">
                  {proof.description}
                </p>
              </article>
            ))}
          </div>

          <Link
            href={whyUs.ctaHref}
            className="group mt-8 inline-flex h-11 w-fit items-center gap-2 rounded-cmt-control bg-cmt-neutral-900 px-5 text-sm font-semibold text-white shadow-cmt-sm transition-colors duration-150 hover:bg-cmt-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
          >
            {whyUs.ctaLabel}
            <ArrowRight
              className="size-4 transition-transform duration-150 group-hover:translate-x-1"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="relative min-h-[280px] sm:min-h-[440px] lg:col-span-5 lg:min-h-0">
          <TravelPath />
          <div className="relative z-10 h-full min-h-[280px] sm:min-h-[440px] overflow-hidden rounded-cmt-lg bg-cmt-neutral-100 shadow-cmt-sm sm:min-h-[560px] lg:absolute lg:inset-0">
            <ContentImage
              src={whyUs.image}
              alt={whyUs.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 520px, 40vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-cmt-neutral-900/75 via-cmt-neutral-900/20 to-transparent px-6 pb-6 pt-24 text-white sm:px-7 sm:pb-7">
              <p className="max-w-[320px] font-display text-xl font-medium leading-snug sm:text-2xl">
                {whyUs.imageCaption}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
