/** Move by up to two reviews, always revealing a different item when possible. */
export function getReviewScrollTarget(scrollLeft: number, period: number, itemCount: number, direction: 1 | -1) {
  if (period <= 0 || itemCount < 1) return null;
  const cards = Math.min(2, Math.max(1, itemCount - 1));
  const target = scrollLeft + direction * (period / itemCount) * cards;
  return {
    left: ((target % period) + period) % period,
    wrapped: target < 0 || target >= period,
  };
}
