import { Glyph } from "@/lib/adminIcons";
import { ArrowUpRight, Ticket } from "lucide-react";
import type { PackageFact } from "@/lib/packageData";
import { PERMIT_BOOKING_URL } from "@/lib/packageFacts";
import styles from "./PackageFactsBar.module.css";

export default function PackageFactsBar({ facts, permitRequired = false, className = "" }: {
  facts: (PackageFact & { value: string })[];
  permitRequired?: boolean;
  className?: string;
}) {
  const visible = facts.filter((fact) => fact.visible !== false);
  if (!visible.length) return null;

  return (
    <section aria-label="Package quick facts" className={`${styles.bar} ${className}`}>
      <div className={styles.layout}>
        <div className={styles.facts}>
          {visible.map((fact) => (
            <div key={fact.id} className={styles.fact}>
              <div className={styles.heading}>
                <span className={styles.icon}><Glyph name={fact.icon} className="size-[18px]" /></span>
                <p className={styles.label}>{fact.label}</p>
              </div>
              <p className={styles.value}>{fact.value}</p>
            </div>
          ))}
        </div>
        <div className={`${styles.permit} ${permitRequired ? styles.required : ""}`}>
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
        </div>
      </div>
    </section>
  );
}
