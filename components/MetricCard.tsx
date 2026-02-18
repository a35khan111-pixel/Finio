"use client";

import { LucideIcon } from "lucide-react";
import { PrivacyValue } from "./PrivacyValue";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-50 dark:bg-indigo-500/10",
  trend,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              trend.positive
                ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
                : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
        <PrivacyValue>{value}</PrivacyValue>
      </p>
      {subtitle && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
