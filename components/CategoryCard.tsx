"use client";

import { useBudgetStore, Category } from "@/store/useBudgetStore";
import { formatCurrency, getPercentage, CATEGORY_ICONS } from "@/utils/formatters";
import { ProgressBar } from "./ProgressBar";
import { PrivacyValue } from "./PrivacyValue";
import { Pencil, Trash2 } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (id: string) => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const { getCategoryBudget, getCategorySpent } = useBudgetStore();

  const budget = getCategoryBudget(category.id);
  const spent = getCategorySpent(category.id);
  const remaining = budget - spent;
  const percentage = getPercentage(spent, budget);
  const exceeded = budget > 0 && spent > budget;

  return (
    <div
      className={`bg-white dark:bg-slate-800/60 rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg ${
        exceeded
          ? "border-red-200 dark:border-red-500/30 hover:shadow-red-100/50 dark:hover:shadow-red-900/20 animate-pulse-subtle"
          : "border-slate-200/80 dark:border-slate-700/60 hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: `${category.color}18` }}
          >
            {CATEGORY_ICONS[category.icon] || "💰"}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              {category.name}
            </h3>
            {exceeded && (
              <span className="text-xs text-red-500 font-medium">Budget exceeded!</span>
            )}
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(category)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(category.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {budget > 0 ? (
        <>
          <div className="mb-3">
            <ProgressBar value={percentage} exceeded={exceeded} height="h-2" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide mb-0.5">Budget</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                <PrivacyValue>{formatCurrency(budget)}</PrivacyValue>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide mb-0.5">Spent</p>
              <p className={`text-sm font-bold ${exceeded ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
                <PrivacyValue>{formatCurrency(spent)}</PrivacyValue>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide mb-0.5">Left</p>
              <p
                className={`text-sm font-bold ${
                  exceeded
                    ? "text-red-500"
                    : remaining < budget * 0.15
                    ? "text-amber-500"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <PrivacyValue>
                  {exceeded ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
                </PrivacyValue>
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex justify-between items-center">
            <div
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${category.color}18`, color: category.color }}
            >
              {percentage}% used
            </div>
            {exceeded && (
              <span className="text-[10px] text-red-500 font-medium">
                <PrivacyValue>{formatCurrency(Math.abs(remaining))}</PrivacyValue> over budget
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-3">
          <p className="text-sm text-slate-400 dark:text-slate-500">No budget set</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {spent > 0 ? (
              <><PrivacyValue>{formatCurrency(spent)}</PrivacyValue> spent</>
            ) : (
              "Click edit to set a budget"
            )}
          </p>
        </div>
      )}
    </div>
  );
}
