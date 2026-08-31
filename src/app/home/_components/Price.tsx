/* Price block — design.md §17.2: Space Grotesk, tabular figures, always
   #0F172A on light (never yellow), currency mark at 70% of the numeral,
   strikethrough original before the live price, saving in success green. */

const formatINR = (value: number) => value.toLocaleString("en-IN");

type PriceProps = {
  price: number;
  originalPrice?: number;
  /** Qualifier printed right of the numeral (§17.2). */
  qualifier?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "light" | "dark";
  showSaving?: boolean;
};

const SIZES = {
  sm: "text-base sm:text-lg",
  md: "text-lg sm:text-xl",
  lg: "text-xl sm:text-2xl",
  /* Comparison cards, where the price is the thing being compared. */
  xl: "text-2xl sm:text-[28px]",
} as const;

export default function Price({
  price,
  originalPrice,
  qualifier = "per person",
  size = "md",
  tone = "light",
  showSaving = false,
}: PriceProps) {
  const isDark = tone === "dark";
  const hasCut = typeof originalPrice === "number" && originalPrice > price;

  return (
    <div>
      {hasCut && (
        <p
          className={`text-xs line-through tabular-nums ${
            isDark ? "text-cmt-neutral-400" : "text-cmt-neutral-400"
          }`}
        >
          ₹{formatINR(originalPrice!)}
        </p>
      )}

      <p
        className={`font-display font-bold tabular-nums ${SIZES[size]} ${
          isDark ? "text-cmt-primary-400" : "text-cmt-neutral-900"
        }`}
      >
        <span className="text-[0.7em] align-baseline">₹</span>
        <span className="ml-0.5">{formatINR(price)}</span>
        {qualifier && (
          <span
            className={`ml-1.5 text-xs font-normal ${
              isDark ? "text-cmt-neutral-400" : "text-cmt-neutral-500"
            }`}
          >
            {qualifier}
          </span>
        )}
      </p>

      {showSaving && hasCut && (
        <p className="mt-0.5 text-xs font-semibold tabular-nums text-cmt-success-700">
          Save ₹{formatINR(originalPrice! - price)}
        </p>
      )}
    </div>
  );
}
