export default function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4" role="separator">
      <span className="h-px flex-1 bg-cmt-neutral-200" />
      <span className="text-[12px] font-medium uppercase tracking-[0.008em] text-cmt-neutral-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-cmt-neutral-200" />
    </div>
  );
}
