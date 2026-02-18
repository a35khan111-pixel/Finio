"use client";

import { useState } from "react";
import { useBudgetStore, Category } from "@/store/useBudgetStore";
import { formatCurrency, getPercentage } from "@/utils/formatters";
import { CategoryCard } from "@/components/CategoryCard";
import { SetBudgetModal } from "@/components/SetBudgetModal";
import { BudgetHealthScore } from "@/components/BudgetHealthScore";
import { ProgressBar } from "@/components/ProgressBar";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { PeriodPicker } from "@/components/PeriodPicker";
import { PrivacyValue } from "@/components/PrivacyValue";
import { Plus, Wallet, AlertTriangle, PiggyBank } from "lucide-react";
import { CATEGORY_ICONS } from "@/utils/formatters";

export default function BudgetsPage() {
  const {
    categories,
    deleteCategory,
    getTotalBudgeted,
    getCategoryBudget,
    getCategorySpent,
    getPeriodLabel,
    income,
  } = useBudgetStore();

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const totalBudgeted = getTotalBudgeted();
  const unbudgeted = income - totalBudgeted;
  const periodLabel = getPeriodLabel();

  const overBudgetCategories = categories.filter((cat) => {
    const budget = getCategoryBudget(cat.id);
    const spent = getCategorySpent(cat.id);
    return budget > 0 && spent > budget;
  });

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setBudgetModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteCategory(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const categoriesWithBudget = categories.filter(
    (c) => getCategoryBudget(c.id) > 0
  );
  const categoriesWithoutBudget = categories.filter(
    (c) => getCategoryBudget(c.id) === 0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Envelope Budgets
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {periodLabel} · {categoriesWithBudget.length} active budget
            {categoriesWithBudget.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodPicker />
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setBudgetModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </div>
      </div>

      {/* Over-budget alert */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3 animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {overBudgetCategories.length} categor
              {overBudgetCategories.length === 1 ? "y" : "ies"} over budget
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
              {overBudgetCategories.map((c) => c.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                Budget Allocation
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                <PrivacyValue>{formatCurrency(totalBudgeted)}</PrivacyValue>{" "}
                <span className="text-sm font-normal text-slate-400">
                  / <PrivacyValue>{formatCurrency(income)}</PrivacyValue>
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                Unallocated
              </p>
              <p
                className={`text-lg font-bold ${
                  unbudgeted < 0
                    ? "text-red-500"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <PrivacyValue>{formatCurrency(Math.abs(unbudgeted))}</PrivacyValue>
                {unbudgeted < 0 && " over"}
              </p>
            </div>
          </div>

          <ProgressBar
            value={getPercentage(totalBudgeted, income)}
            exceeded={totalBudgeted > income}
            height="h-3"
          />

          <div className="mt-5 space-y-2.5">
            {categoriesWithBudget.slice(0, 5).map((cat) => {
              const budget = getCategoryBudget(cat.id);
              const pct = income > 0 ? (budget / income) * 100 : 0;
              const spent = getCategorySpent(cat.id);
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-sm w-5 text-center">
                    {CATEGORY_ICONS[cat.icon] || "💰"}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {cat.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        <PrivacyValue>{formatCurrency(spent)}</PrivacyValue> / <PrivacyValue>{formatCurrency(budget)}</PrivacyValue>
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full rounded-full opacity-20"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                      <div
                        className="absolute h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, getPercentage(spent, budget))}%`,
                          backgroundColor: spent > budget ? "#ef4444" : cat.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <BudgetHealthScore />
      </div>

      {/* Envelope cards — budgeted */}
      {categoriesWithBudget.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Active Envelopes
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">
              {categoriesWithBudget.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoriesWithBudget.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unbudgeted categories */}
      {categoriesWithoutBudget.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PiggyBank className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No Budget Set
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">
              {categoriesWithoutBudget.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoriesWithoutBudget.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No categories yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 mb-6">
            Create your first envelope to start budgeting
          </p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setBudgetModalOpen(true);
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            Create First Category
          </button>
        </div>
      )}

      <SetBudgetModal
        open={budgetModalOpen}
        onClose={() => {
          setBudgetModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
      />

      <AddExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />
    </div>
  );
}
