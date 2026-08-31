import { Star } from "lucide-react";

/* Review rating — design.md §17.5: 16px yellow stars, numeric value in
   Body Small 600, review count in Caption. Never colour alone: the number
   is always printed next to the stars. */

type RatingProps = {
  value: number;
  reviews?: number;
  /** Star row is decorative when the numeric value is already shown. */
  showStars?: boolean;
  tone?: "light" | "dark";
  className?: string;
};

export default function Rating({
  value,
  reviews,
  showStars = true,
  tone = "light",
  className = "",
}: RatingProps) {
  const isDark = tone === "dark";
  const rounded = Math.round(value);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {showStars && (
        <span className="flex items-center gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < rounded
                  ? "fill-cmt-primary-500 text-cmt-primary-500"
                  : isDark
                    ? "text-cmt-neutral-600"
                    : "text-cmt-neutral-300"
              }`}
              strokeWidth={2}
            />
          ))}
        </span>
      )}

      <span
        className={`text-sm font-semibold tabular-nums ${
          isDark ? "text-white" : "text-cmt-neutral-900"
        }`}
      >
        {value.toFixed(1)}
      </span>

      {typeof reviews === "number" && (
        <span className={`text-xs ${isDark ? "text-cmt-neutral-400" : "text-cmt-neutral-500"}`}>
          ({reviews})
        </span>
      )}
    </div>
  );
}
