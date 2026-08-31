import { XCircle } from "lucide-react";

export default function AuthAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-cmt-control border border-cmt-error-500/40 bg-cmt-error-100 p-4"
    >
      <XCircle
        size={20}
        strokeWidth={2}
        className="mt-0.5 shrink-0 text-cmt-error-500"
        aria-hidden="true"
      />
      <p className="text-[14px] leading-[1.5] text-cmt-neutral-900">{message}</p>
    </div>
  );
}
