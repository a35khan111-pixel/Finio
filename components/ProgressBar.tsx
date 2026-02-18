"use client";

interface ProgressBarProps {
  value: number; // 0-100
  exceeded?: boolean;
  className?: string;
  height?: string;
  color?: string;
}

export function ProgressBar({
  value,
  exceeded = false,
  className = "",
  height = "h-2",
  color,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const getColor = () => {
    if (color) return color;
    if (exceeded || value > 100) return "bg-red-500";
    if (value >= 85) return "bg-amber-500";
    if (value >= 70) return "bg-yellow-500";
    return "bg-indigo-500";
  };

  return (
    <div
      className={`w-full ${height} bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden ${className}`}
    >
      <div
        className={`${height} ${getColor()} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
