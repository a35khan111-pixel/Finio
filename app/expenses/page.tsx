"use client";

import { useState } from "react";
import { useBudgetStore, Expense } from "@/store/useBudgetStore";
import { formatCurrency } from "@/utils/formatters";
import { ExpenseList } from "@/components/ExpenseList";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { PeriodPicker } from "@/components/PeriodPicker";
import { PrivacyValue } from "@/components/PrivacyValue";
import { Plus, Receipt, TrendingDown, Calendar } from "lucide-react";

export default function ExpensesPage() {
  const { getTotalSpent, getPeriodExpenses, getPeriodLabel, periodStart, periodEnd } =
    useBudgetStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const expenses = getPeriodExpenses();
  const totalSpent = getTotalSpent();
  const periodLabel = getPeriodLabel();

  // Avg per day based on days elapsed in period (up to today)
  const today = new Date().toISOString().slice(0, 10);
  const effectiveEnd = periodEnd < today ? periodEnd : today;
  const start = new Date(periodStart + "T00:00:00");
  const end = new Date(effectiveEnd + "T00:00:00");
  const daysElapsed = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const avgPerDay = totalSpent / daysElapsed;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Expenses
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {periodLabel} · {expenses.length} transaction
            {expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodPicker />
          <button
            onClick={() => {
              setEditExpense(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60">
          <div className="w-9 h-9 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center mb-3">
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Total Spent</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            <PrivacyValue>{formatCurrency(totalSpent)}</PrivacyValue>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60">
          <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3">
            <Receipt className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Transactions</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{expenses.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60">
          <div className="w-9 h-9 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Avg / Day</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            <PrivacyValue>{formatCurrency(avgPerDay)}</PrivacyValue>
          </p>
        </div>
      </div>

      {/* Quick add */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 mb-6">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Quick Add
        </p>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 15, 20, 25, 50, 100].map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setEditExpense(null);
                setModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30 min-h-[44px]"
            >
              ${amount}
            </button>
          ))}
          <button
            onClick={() => {
              setEditExpense(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            Custom
          </button>
        </div>
      </div>

      {/* Expense List */}
      <ExpenseList
        onEdit={(expense) => {
          setEditExpense(expense);
          setModalOpen(true);
        }}
        periodStart={periodStart}
        periodEnd={periodEnd}
      />

      <AddExpenseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditExpense(null);
        }}
        editExpense={editExpense}
      />
    </div>
  );
}
