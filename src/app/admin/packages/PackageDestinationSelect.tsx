"use client";

import { useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputClass } from '../_components/ui';

export default function PackageDestinationSelect({ value, options, onChange, disabled }: {
  value: string; options: string[]; onChange: (value: string) => void; disabled: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(-1);
  const unique = [...new Map(options.map(option => option.trim()).filter(Boolean).map(option => [option.toLocaleLowerCase(), option])).values()].sort((a, b) => a.localeCompare(b));
  const query = value.trim();
  const matches = unique.filter(option => !searching || option.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const canAdd = Boolean(query) && !unique.some(option => option.toLocaleLowerCase() === query.toLocaleLowerCase());
  const choices = [...matches, ...(canAdd ? [query] : [])];
  const expanded = open && !disabled;
  const choose = (destination: string) => {
    onChange(destination);
    input.current?.focus();
    setOpen(false);
    setSearching(false);
    setActive(-1);
  };
  return <div className="relative" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); }
  }}>
    <label htmlFor={id} className="mb-1 block text-xs font-medium text-cmt-neutral-700">Filed under destination</label>
    <div className="relative">
      <input ref={input} id={id} className={`${inputClass} pr-12`} value={value} disabled={disabled}
        role="combobox" aria-expanded={expanded} aria-controls={`${id}-options`} aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 && active < choices.length ? `${id}-option-${active}` : undefined}
        aria-describedby={`${id}-hint`} autoComplete="off" placeholder="Select or type a destination"
        onFocus={() => { setOpen(true); setSearching(false); }}
        onChange={event => { onChange(event.target.value); setSearching(true); setOpen(true); setActive(-1); }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); setOpen(true);
            const next = event.key === 'ArrowDown' ? Math.min(active + 1, choices.length - 1) : active <= 0 ? choices.length - 1 : active - 1;
            setActive(next);
            requestAnimationFrame(() => document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: 'nearest' }));
          } else if (event.key === 'Enter' && expanded) {
            event.preventDefault();
            const exact = unique.find(option => option.toLocaleLowerCase() === query.toLocaleLowerCase());
            if (active >= 0 && choices[active]) choose(choices[active]);
            else if (query) choose(exact ?? query);
          } else if (event.key === 'Escape' && expanded) {
            event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1);
          }
        }} />
      <button type="button" aria-label="Show destinations" aria-expanded={expanded} aria-controls={`${id}-options`} disabled={disabled}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-cmt-neutral-500 focus-visible:outline-2 focus-visible:outline-cmt-primary-500"
        onMouseDown={event => event.preventDefault()}
        onClick={() => { input.current?.focus(); setOpen(!expanded); setSearching(false); setActive(-1); }}><ChevronDown size={17} /></button>
    </div>
    {expanded && <ul id={`${id}-options`} role="listbox" aria-label="Destinations" className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-cmt-neutral-200 bg-white p-1 shadow-lg">
      {choices.map((destination, index) => <li key={`${destination}-${index}`} id={`${id}-option-${index}`} role="option" aria-selected={active === index}
        className={`cursor-pointer rounded-md px-3 py-2.5 text-sm ${active === index ? 'bg-cmt-primary-100 text-cmt-neutral-900' : 'text-cmt-neutral-700 hover:bg-cmt-neutral-50'}`}
        onMouseDown={event => event.preventDefault()} onClick={() => choose(destination)}>
        {canAdd && index === matches.length ? `+ Add “${destination}”` : destination}
      </li>)}
      {!choices.length && <li className="px-3 py-3 text-sm text-cmt-neutral-500">Type a destination name to add it.</li>}
    </ul>}
    <p id={`${id}-hint`} className="mt-1.5 text-xs leading-5 text-cmt-neutral-500">Choose an existing destination or type a new one. New destinations become available after you save the package.</p>
  </div>;
}
