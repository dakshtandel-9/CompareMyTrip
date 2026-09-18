"use client";

import { PackageGlyph as Glyph } from "@/lib/PackageGlyph";
import { ArrowUpRight, Ticket } from "lucide-react";
import type { PackageFact } from "@/lib/packageData";
import { InlineText, EditAction, usePackageEditing } from "./PackageInlineEditing";
import { getPackageFacts } from "@/lib/packageFacts";
import { PERMIT_BOOKING_URL } from "@/lib/packageFacts";
import styles from "./PackageFactsBar.module.css";

export default function PackageFactsBar({ facts, permitRequired = false, permitHidden = false, className = "" }: {
  facts: (PackageFact & { value: string })[];
  permitRequired?: boolean;
  permitHidden?: boolean;
  className?: string;
}) {
  const editor = usePackageEditing();
  const source = editor?.value.details?.facts ?? [];
  const visible = editor ? getPackageFacts({ ...editor.value, details: { ...editor.value.details!, factsHidden: false, facts: source.map(fact => ({ ...fact, visible: true })) } }) : facts.filter((fact) => fact.visible !== false);
  if (!visible.length && !editor) return null;

  return (
    <section aria-label="Package quick facts" className={`${styles.bar} ${editor ? styles.editing : ""} ${className}`}>
      <header className={styles.sectionHeader}>
        <p className={styles.title}>YOUR TRIP AT A GLANCE</p>
        <h2 className="font-display text-2xl font-semibold">Trip snapshot</h2>
      </header>
      {editor && <label className="mb-3 block text-xs"><input type="checkbox" checked={!editor.value.details?.factsHidden} onChange={event => editor.change(["details", "factsHidden"], !event.target.checked)} /> Show quick details</label>}
      {editor && <label className="mb-3 block text-xs"><input type="checkbox" disabled={editor.disabled} checked={!permitHidden} onChange={event => editor.change(["details", "permitHidden"], !event.target.checked)} /> Show permit on page</label>}
      <div className={`${styles.layout} ${permitHidden ? styles.withoutPermit : ""}`}>
        <div className={styles.facts}>
          {visible.map((fact, index) => (
            <div key={fact.id} className={styles.fact}>
              <div className={styles.heading}>
                <div className={styles.icon}>{editor ? <details className={styles.iconPicker}><summary aria-label={`Change ${fact.label} icon`} className="cursor-pointer list-none"><Glyph name={fact.icon} className="size-[18px]" /></summary><div className={styles.iconPopover}>{editor.renderIconPicker?.(fact.icon, name => editor.change(["details", "facts", index, "icon"], name))}</div></details> : <Glyph name={fact.icon} className="size-[18px]" />}</div>
                <p className={styles.label}><InlineText value={fact.label} path={["details", "facts", index, "label"]} label="Quick detail label" /></p>
              </div>
              <p className={styles.value}><InlineText value={fact.value} path={["details", "facts", index, "value"]} label={fact.label} /></p>{editor && <div className={styles.factActions}><label><input type="checkbox" checked={source[index]?.visible !== false} onChange={event => editor.change(["details", "facts", index, "visible"], event.target.checked)} /> Show</label><EditAction kind="remove" label="Remove fact" onClick={() => editor.change(["details", "facts"], source.filter((_, i) => i !== index))} /></div>}
            </div>
          ))}
        </div>
        {!permitHidden && <div className={`${styles.permit} ${permitRequired ? styles.required : ""}`}>
          <div className={styles.permitInfo}>
            <div className={styles.heading}>
              <Ticket className="size-[18px] shrink-0" aria-hidden="true" />
              <p className={styles.label}>Permit</p>
            </div>
            <p className={styles.permitStatus}><span className={styles.statusDot} aria-hidden="true" />{permitRequired ? "Required" : "Not required"}</p>
          </div>
          {permitRequired && (
            <a
              href={PERMIT_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Book permit on Aranya Vihaara (opens in a new tab)"
              className={styles.permitLink}
            >
              Book permit <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>}
      </div>
      <EditAction label="Add quick detail" onClick={() => editor?.change(["details", "facts"], [...source, { id: crypto.randomUUID(), label: "New detail", value: "", icon: "MapPin", visible: true }])} />
    </section>
  );
}
