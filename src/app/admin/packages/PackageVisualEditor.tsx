"use client";

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { ImagePlus, Pencil, X } from 'lucide-react';
import type { TravelPackage } from '@/lib/packageData';
import { getPackageBookingBadges, getPackageDetails } from '@/lib/packageData';
import { getPackagePageSections } from '@/lib/packageDetailSections';
import { PACKAGE_EDITOR_AREAS, type PackageEditorArea } from './PackageDetailEditor';
import { packageVisualSectionArea } from './packageVisualTargets';
import styles from './PackageVisualEditor.module.css';

export default function PackageVisualEditor({ pkg, editing, disabled, section, open, onSelect, onClose, page, children, error }: {
  pkg: TravelPackage; editing: boolean; disabled: boolean; section: PackageEditorArea; open: boolean;
  onSelect: (area: PackageEditorArea) => void; onClose: () => void; page: ReactNode; children: ReactNode; error: string;
}) {
  const panel = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [focusTarget, setFocusTarget] = useState('');
  const pageSections = getPackagePageSections(getPackageDetails(pkg));
  useEffect(() => {
    if (!open || !editing || !panel.current) return;
    panel.current.querySelector<HTMLElement>('[data-inspector-heading]')?.focus({ preventScroll: true });
    const content = panel.current.querySelector<HTMLElement>('[data-inspector-content]');
    if (!content) return;
    const target = focusTarget.startsWith('section:')
      ? Array.from(content.querySelectorAll<HTMLElement>('[data-package-section-editor]')).find(element => element.dataset.packageSectionEditor === focusTarget.slice(8))
      : Array.from(content.querySelectorAll<HTMLElement>('[data-package-field], label')).find(element => element.dataset.packageField === focusTarget || Boolean(focusTarget && element.tagName === 'LABEL' && element.textContent?.trim().startsWith(focusTarget)));
    for (let parent = target?.parentElement; parent && parent !== content; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true;
    content.scrollTo({ top: target ? target.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - 12 : 0 });
  }, [open, editing, section, focusTarget]);
  const select = (area: PackageEditorArea, target = '') => {
    if (disabled) return;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setFocusTarget(target);
    onSelect(area);
  };
  const close = () => {
    if (disabled) return;
    onClose();
    trigger.current?.focus({ preventScroll: true });
  };
  const editTarget = (event: MouseEvent<HTMLDivElement>) => {
    if (!editing || disabled || !(event.target instanceof Element)) return;
    const target = event.target;
    // Keep page navigation and disclosures usable while choosing what to edit.
    if (target.closest('nav, summary')) return;
    let area: PackageEditorArea | undefined;
    let field = '';
    const sectionElement = target.closest('section[id]');
    if (sectionElement) area = packageVisualSectionArea(sectionElement.id, pageSections);
    if (!area && target.closest('[aria-label="Package quick facts"]')) area = 'facts';
    if (!area && target.closest('#booking-options')) area = target.closest('img') ? 'images' : target.closest('.cmt-package-booking-policy') ? 'policy' : 'booking';
    if (!area && target.closest('.cmt-package-header')) area = 'basics';
    if (!area && target.closest('.cmt-package-metadata > span:nth-child(2)')) area = 'reviews';
    if (!area && target.closest('.cmt-package-metadata')) area = 'basics';
    if (!area && target.closest('.cmt-package-intro')) area = 'overview';
    if (!area && target.closest('.cmt-package-content > div:first-child')) area = 'images';
    if (!area) return;
    if (sectionElement?.id.startsWith('package-section-')) field = `section:${sectionElement.id.slice('package-section-'.length)}`;
    else if (area === 'overview' && sectionElement?.id === 'package-about') field = 'About this trip';
    else if (area === 'highlights') field = 'Trip highlights';
    else if (area === 'basics') field = target.closest('.cmt-package-header') ? 'Package title' : 'Destination / route shown on the page';
    else if (area === 'booking') {
      const badge = target.closest('[aria-label="Package badges"] > span');
      if (badge?.parentElement) {
        const visible = getPackageBookingBadges(pkg).filter(item => item.visible && item.text.trim());
        const selected = visible[Array.from(badge.parentElement.children).indexOf(badge)];
        if (selected) field = `Badge ${['package', 'stay', 'flights'].indexOf(selected.id) + 1} text`;
      }
      else if (target.closest('.cmt-package-availability')) field = 'Availability note';
      else if (target.closest('.cmt-package-original-price')) field = 'Original price';
      else field = 'Selling price';
    }
    else if (area === 'coverage') field = sectionElement?.id === 'package-exclusions' ? 'Not included' : 'Included';
    else if (area === 'policy') field = 'Cancellation policy';
    event.preventDefault(); event.stopPropagation(); select(area, field);
  };
  const label = PACKAGE_EDITOR_AREAS.find(area => area.id === section)?.label;
  return <div className={styles.root}>
    {editing && <div className={styles.guide}>
      <div><p><Pencil size={15} aria-hidden="true" /> Click the page to edit</p><span>Click text, a photo, or the pricing card. Open dropdowns to see their content. Changes appear here as you edit.</span></div>
      <label>Add or edit a section<select aria-label="Add or edit a page section" disabled={disabled} value="" onChange={event => select(event.target.value as PackageEditorArea)}><option value="" disabled>Choose a section…</option>{PACKAGE_EDITOR_AREAS.map(area => <option key={area.id} value={area.id}>{area.label}</option>)}</select></label>
    </div>}
    {editing && (!pkg.title.trim() || !pkg.image) && <div className={styles.setup}>
      <strong>Build your package on this page</strong><span>Start with the title and photos, then add the details travellers need.</span>
      <button type="button" disabled={disabled} onClick={() => select('basics')}><Pencil size={15} />Edit package details</button>
      <button type="button" disabled={disabled} onClick={() => select('images')}><ImagePlus size={15} />Upload package photos</button>
    </div>}
    <div className={`${styles.canvas} ${editing && !disabled ? styles.editing : ''}`} onClickCapture={editTarget}>
      {page}
    </div>
    {editing && <div className={styles.sectionAccess} aria-label="Manage all package sections">
      <p>Add content or edit hidden sections</p><div>{PACKAGE_EDITOR_AREAS.map(area => <button key={area.id} type="button" disabled={disabled} onClick={() => select(area.id)}>{area.label}</button>)}</div>
    </div>}
    <aside hidden={!editing || !open} ref={panel} className={styles.inspector} aria-label="Package section editor" onKeyDown={event => {
      if (event.key === 'Escape' && !disabled && !(event.target instanceof Element && event.target.closest('[role="dialog"], dialog'))) { event.stopPropagation(); close(); }
    }}>
      <header><div><p data-inspector-heading tabIndex={-1}>{label}</p><span>Editing this package’s draft · live preview</span></div><button type="button" aria-label="Close section editor" disabled={disabled} onClick={close}><X size={20} /></button></header>
      <div className={styles.panelTools}><label>Section<select aria-label="Section to edit" disabled={disabled} value={section} onChange={event => select(event.target.value as PackageEditorArea)}>{PACKAGE_EDITOR_AREAS.map(area => <option key={area.id} value={area.id}>{area.label}</option>)}</select></label><button type="button" disabled={disabled} onClick={close}>Done editing</button></div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div data-inspector-content className={styles.panelContent}>{children}</div>
      <footer>Changes stay in this draft. Use <strong>Save package</strong> in the top bar to apply them.</footer>
    </aside>
  </div>;
}
