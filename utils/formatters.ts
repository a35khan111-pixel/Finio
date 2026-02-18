export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function getPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getHealthScoreLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-500" };
  if (score >= 60) return { label: "Good", color: "text-blue-500" };
  if (score >= 40) return { label: "Fair", color: "text-amber-500" };
  return { label: "At Risk", color: "text-red-500" };
}

export function getHealthScoreRingColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

/**
 * Returns daily spending data for a given date range.
 * Each entry has a `day` label (e.g. "Feb 18") and an `amount`.
 */
export function getDailySpendingData(
  expenses: Array<{ date: string; amount: number }>,
  periodStart: string,
  periodEnd: string
): Array<{ day: string; amount: number }> {
  const start = new Date(periodStart + "T00:00:00");
  const end = new Date(periodEnd + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clamp end to today so we don't show future days as $0
  const effectiveEnd = end > today ? today : end;

  // Build a map of date string -> total amount
  const dailyMap: Record<string, number> = {};
  expenses.forEach((e) => {
    if (e.date >= periodStart && e.date <= periodEnd) {
      dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
    }
  });

  const result: Array<{ day: string; amount: number }> = [];
  const cursor = new Date(start);
  while (cursor <= effectiveEnd) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({
      day: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: dailyMap[key] || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export const CATEGORY_ICONS: Record<string, string> = {
  home: "🏠",
  utensils: "🍽️",
  car: "🚗",
  film: "🎬",
  heart: "❤️",
  "shopping-bag": "🛍️",
  zap: "⚡",
  "piggy-bank": "🐷",
  coffee: "☕",
  airplane: "✈️",
  book: "📚",
  music: "🎵",
  gym: "💪",
  pet: "🐾",
  gift: "🎁",
  phone: "📱",
};

export const PRESET_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#22c55e",
  "#f97316",
  "#84cc16",
  "#14b8a6",
  "#e879f9",
];
