"use client";

import Link from "next/link";
import { ExternalLink, Plane } from "lucide-react";
import type { ComingSoonContent } from "@/lib/comingSoon";
import { useSiteContent } from "@/lib/useSiteContent";
import ImageField from "../_components/ImageField";
import { Card, TextArea, TextField } from "../_components/ui";

export default function ComingSoonEditor({ value, onChange }: {
  value: ComingSoonContent;
  onChange: (next: ComingSoonContent) => void;
}) {
  const { comingSoon: published } = useSiteContent();
  return <div className="space-y-5">
    <Card icon={<Plane className="size-5" />} title="Coming-soon page" description="Turn the switch on and publish to show this page to website visitors. Turn it off and publish to reopen the website. Admin sign-in and existing booking/payment access remain available.">
      <div className="space-y-4">
        <TextField label="Headline" value={value.title} onChange={(title) => onChange({ ...value, title })} />
        <TextArea label="Message" value={value.message} onChange={(message) => onChange({ ...value, message })} />
        <ImageField label="Coming-soon image" value={value.image} onChange={(image) => onChange({ ...value, image })} aspect="aspect-[4/5]" />
        <TextField label="Image description (alt text)" value={value.imageAlt} onChange={(imageAlt) => onChange({ ...value, imageAlt })} />
        <p className="text-xs leading-6 text-cmt-neutral-500">The contact button uses the phone number in the Header settings. The coming-soon page returns 404 while the published switch is off. Enable the switch and publish to make the page available.</p>
        {published.enabled && <Link href="/coming-soon" target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold hover:bg-cmt-neutral-50"><ExternalLink className="size-4" aria-hidden="true" /> View coming-soon page</Link>}
      </div>
    </Card>
  </div>;
}
