"use client";

import { useState } from "react";
import styles from "./ContentWorkspace.module.css";
import { SERVICES } from "@/app/add-on/services";
import type { AddOnContent, AddOnServiceContent } from "@/lib/siteContent";
import { Card, TextArea, TextField } from "../_components/ui";

export default function AddOnEditor({
  value,
  onChange,
}: {
  value: AddOnContent;
  onChange: (next: AddOnContent) => void;
}) {
  const [activeService, setActiveService] = useState<keyof AddOnContent["services"]>(SERVICES[0].id);
  const patch = (id: keyof AddOnContent["services"], next: Partial<AddOnServiceContent>) =>
    onChange({
      ...value,
      services: { ...value.services, [id]: { ...value.services[id], ...next } },
    });

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-cmt-neutral-600">
        Choose a service to update the introduction above its enquiry form.
      </p>
      <div className={`${styles.groupTabs} !mt-0`} role="group" aria-label="Travel service to edit">
        {SERVICES.map(({ id, label }) => <button key={id} type="button" aria-pressed={activeService === id} onClick={() => setActiveService(id)}>{label}</button>)}
      </div>
      {SERVICES.filter(({ id }) => id === activeService).map(({ id, label, icon: Icon }) => (
        <Card
          key={id}
          icon={<Icon className="size-5" />}
          title={label}
          description={`Shown at the top when ${label} is selected.`}
        >
          <TextField
            label="Small heading"
            value={value.services[id].eyebrow}
            onChange={(eyebrow) => patch(id, { eyebrow })}
            hint="The small text above the heading."
          />
          <TextField
            className="mt-4"
            label="Heading"
            value={value.services[id].title}
            onChange={(title) => patch(id, { title })}
          />
          <TextArea
            className="mt-4"
            label="Description"
            value={value.services[id].description}
            onChange={(description) => patch(id, { description })}
          />
        </Card>
      ))}
    </div>
  );
}
