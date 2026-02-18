"use client";

import { useState } from "react";
import { useBudgetStore, Expense } from "@/store/useBudgetStore";
import { formatCurrency, formatShortDate, CATEGORY_ICONS } from "@/utils/formatters";
import { Pencil, Trash2, ChevronUp, ChevronDown, Search } from "lucide-react";
import { PrivacyValue } from "./PrivacyValue";

type SortKey = "date" | "amount" | "category";
type SortDir = "asc" | "desc";

interface ExpenseListProps {
  onEdit?: (expense: Expense) => void;
  maxItems?: number;
  /** Override period start (YYYY-MM-DD). Defaults to store's current period. */
  periodStart?: string;
  /** Override period end (YYYY-MM-DD). Defaults to store's current period. */
  periodEnd?: string;
}

export function ExpenseList({ onEdit, maxItems, periodStart, periodEnd }: ExpenseListProps) {
  const { categories, deleteExpense, getPeriodExpenses } = useBudgetStore();
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const expenses = getPeriodExpenses(periodStart, periodEnd);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = expenses
    .filter((e) => {
      if (!search) return true;
      const cat = categories.find((c) => c.id === e.categoryId);
      return (
        e.note.toLowerCase().includes(search.toLowerCase()) ||
        cat?.name.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      if (sortKey === "amount") cmp = a.amount - b.amount;
      if (sortKey === "category") {
        const catA = categories.find((c) => c.id === a.categoryId)?.name || "";
        const catB = categories.find((c) => c.id === b.categoryId)?.name || "";
        cmp = catA.localeCompare(catB);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const displayed = maxItems ? filtered.slice(0, maxItems) : filtered;

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field)
      return <ChevronUp className="w-3 h-3 text-slate-300 dark:text-slate-600" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-indigo-500" />
    ) : (
      <ChevronDown className="w-3 h-3 text-indigo-500" />
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden">
      {/* Search & sort header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-1 mt-3">
          {(["date", "amount", "category"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                sortKey === key
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {key}
              <SortIcon field={key} />
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-3xl mb-3">💸</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No expenses found</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            {search ? "Try a different search term" : "Add your first expense above"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {displayed.map((expense) => {
            const category = categories.find((c) => c.id === expense.categoryId);
            return (
              <div
                key={expense.id}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: `${category?.color || "#6366f1"}18` }}
                >
                  {CATEGORY_ICONS[category?.icon || ""] || "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {expense.note || category?.name || "Expense"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${category?.color || "#6366f1"}18`,
                        color: category?.color || "#6366f1",
                      }}
                    >
                      {category?.name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatShortDate(expense.date)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    <PrivacyValue>{formatCurrency(expense.amount)}</PrivacyValue>
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(expense)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirmDelete === expense.id) {
                          deleteExpense(expense.id);
                          setConfirmDelete(null);
                        } else {
                          setConfirmDelete(expense.id);
                          setTimeout(() => setConfirmDelete(null), 3000);
                        }
                      }}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                        confirmDelete === expense.id
                          ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                          : "text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {maxItems && filtered.length > maxItems && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Showing {maxItems} of {filtered.length} expenses
          </p>
        </div>
      )}
    </div>
  );
}
