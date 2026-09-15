"use client";

import { Plus, Trash2 } from "lucide-react";
import type { PackageItineraryDay } from "@/lib/packageData";
import { FieldLabel, inputClass, textareaClass } from "../_components/ui";

type Activities = NonNullable<PackageItineraryDay["activities"]>;

export default function ItineraryActivitiesEditor({ value, onChange }: { value: Activities; onChange: (value: Activities) => void }) {
  const patch = (index: number, key: keyof Activities[number], text: string) => onChange(value.map((activity, i) => i === index ? { ...activity, [key]: text } : activity));
  return <div className="space-y-3 sm:col-span-2">
    <div><h3 className="text-sm font-semibold">Timed activities</h3><p className="mt-1 text-xs text-cmt-neutral-500">Add each stop in order, with a time such as 10:30 PM, Early morning or Sunrise.</p></div>
    {value.map((activity, index) => <div key={index} className="rounded-cmt-control border border-cmt-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold">Activity {index + 1}</p><button type="button" aria-label={`Remove activity ${index + 1}`} onClick={() => onChange(value.filter((_, i) => i !== index))} className="grid size-9 place-items-center rounded-lg text-cmt-error-700 hover:bg-cmt-neutral-50"><Trash2 className="size-4" /></button></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><FieldLabel>Time / part of day</FieldLabel><input value={activity.time} onChange={(e) => patch(index, "time", e.target.value)} placeholder="e.g. 10:30 PM onwards" className={inputClass} /></label>
        <label><FieldLabel>Activity title *</FieldLabel><input value={activity.title} onChange={(e) => patch(index, "title", e.target.value)} placeholder="e.g. Pickup from Bangalore" className={inputClass} /></label>
        <label className="sm:col-span-2"><FieldLabel>Activity details</FieldLabel><textarea value={activity.description} onChange={(e) => patch(index, "description", e.target.value)} className={textareaClass} /></label>
      </div>
    </div>)}
    <button type="button" onClick={() => onChange([...value, { time: "", title: "", description: "" }])} className="inline-flex min-h-10 items-center gap-2 rounded-cmt-control border border-dashed border-cmt-neutral-300 px-4 text-xs font-semibold"><Plus className="size-4" />Add timed activity</button>
  </div>;
}
