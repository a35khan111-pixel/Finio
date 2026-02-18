"use client";

import { useBudgetStore } from "@/store/useBudgetStore";
import { getHealthScoreLabel, getHealthScoreRingColor } from "@/utils/formatters";
import { PrivacyValue } from "./PrivacyValue";

export function BudgetHealthScore() {
  const { getBudgetHealthScore } = useBudgetStore();
  const score = getBudgetHealthScore();
  const { label, color } = getHealthScoreLabel(score);
  const ringColor = getHealthScoreRingColor(score);

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 flex flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        Budget Health Score
      </p>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-slate-100 dark:text-slate-700"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={ringColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            <PrivacyValue>{score}</PrivacyValue>
          </span>
        </div>
      </div>
      <p className={`text-sm font-semibold mt-3 ${color}`}>{label}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[140px] leading-relaxed">
        Based on your spending vs. budget
      </p>
    </div>
  );
}
