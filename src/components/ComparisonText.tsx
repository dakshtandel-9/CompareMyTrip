"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Keep comparison rows scannable without discarding any saved details. */
export default function ComparisonText({ text, label }: { text: string; label: string }) {
  const id = useId();
  const textRef = useRef<HTMLSpanElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return;

    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <span className="block min-w-0 max-w-full flex-1 basis-full">
      <span
        ref={textRef}
        id={id}
        className={`whitespace-pre-line break-words leading-5 ${expanded ? "block" : "line-clamp-3"}`}
      >
        {text}
      </span>
      {overflows && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          aria-label={`${expanded ? "Show less" : "Show more"}: ${label}`}
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 inline-flex min-h-8 items-center gap-1 rounded-cmt-control text-xs font-semibold text-cmt-neutral-900 underline decoration-cmt-primary-500 underline-offset-4 hover:text-cmt-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 max-md:min-h-11"
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDown className={`size-3.5 ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
