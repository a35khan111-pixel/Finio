"use client";

import { useState } from "react";
import { useBudgetStore } from "@/store/useBudgetStore";
import { formatCurrency, getPercentage } from "@/utils/formatters";
import { MetricCard } from "@/components/MetricCard";
import { BudgetHealthScore } from "@/components/BudgetHealthScore";
import { SpendingPieChart, BudgetVsActualChart, DailySpendingChart } from "@/components/Charts";
import { ExpenseList } from "@/components/ExpenseList";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { ProgressBar } from "@/components/ProgressBar";
import { PeriodPicker } from "@/components/PeriodPicker";
import { PrivacyValue } from "@/components/PrivacyValue";
import { CATEGORY_ICONS } from "@/utils/formatters";
import {
  DollarSign,
  TrendingDown,
  PiggyBank,
  Wallet,
  Plus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Expense } from "@/store/useBudgetStore";

export default function Dashboard() {
  const {
    income,
    setIncome,
    archiveCurrentPeriod,
    getTotalBudgeted,
    getTotalSpent,
    categories,
    getCategoryBudget,
    getCategorySpent,
    getPeriodLabel,
  } = useBudgetStore();

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(income.toString());
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  const totalBudgeted = getTotalBudgeted();
  const totalSpent = getTotalSpent();
  const remaining = income - totalSpent;
  const savingsRate = income > 0 ? ((income - totalSpent) / income) * 100 : 0;
  const spendPercent = getPercentage(totalSpent, totalBudgeted);
  const periodLabel = getPeriodLabel();

  const topCategories = categories
    .map((cat) => ({
      ...cat,
      spent: getCategorySpent(cat.id),
      budget: getCategoryBudget(cat.id),
    }))
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Your financial overview for{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {periodLabel}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodPicker />
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Income Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-indigo-500/20">
        <div>
          <p className="text-indigo-200 text-sm font-medium mb-1">Monthly Income</p>
          {editingIncome ? (
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-2xl">$</span>
              <input
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                onBlur={() => {
                  const val = parseFloat(incomeInput);
                  if (!isNaN(val) && val >= 0) setIncome(val);
                  setEditingIncome(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = parseFloat(incomeInput);
                    if (!isNaN(val) && val >= 0) setIncome(val);
                    setEditingIncome(false);
                  }
                }}
                className="bg-white/20 text-white font-bold text-2xl w-36 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-white/50"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => {
                setIncomeInput(income.toString());
                setEditingIncome(true);
              }}
              className="text-white font-bold text-2xl hover:text-white/80 transition-colors"
            >
              <PrivacyValue>{formatCurrency(income)}</PrivacyValue>
              <span className="text-indigo-200 text-xs ml-2 font-normal">Click to edit</span>
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="text-right">
            <p className="text-indigo-200 text-xs font-medium mb-0.5">Spent</p>
            <p className="text-white font-bold text-lg">
              <PrivacyValue>{formatCurrency(totalSpent)}</PrivacyValue>
            </p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs font-medium mb-0.5">Remaining</p>
            <p className={`font-bold text-lg ${remaining < 0 ? "text-red-300" : "text-emerald-300"}`}>
              <PrivacyValue>{formatCurrency(remaining)}</PrivacyValue>
            </p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs font-medium mb-0.5">Savings Rate</p>
            <p className={`font-bold text-lg ${savingsRate < 0 ? "text-red-300" : "text-emerald-300"}`}>
              <PrivacyValue>{Math.max(0, savingsRate).toFixed(1)}%</PrivacyValue>
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Budgeted"
          value={formatCurrency(totalBudgeted)}
          icon={Wallet}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 dark:bg-indigo-500/10"
          subtitle="Across all categories"
        />
        <MetricCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={TrendingDown}
          iconColor={totalSpent > totalBudgeted ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}
          iconBg={totalSpent > totalBudgeted ? "bg-red-50 dark:bg-red-500/10" : "bg-amber-50 dark:bg-amber-500/10"}
          subtitle={`${spendPercent}% of budget used`}
          trend={
            totalBudgeted > 0
              ? { value: `${spendPercent}%`, positive: spendPercent <= 80 }
              : undefined
          }
        />
        <MetricCard
          title="Remaining Budget"
          value={formatCurrency(Math.max(0, totalBudgeted - totalSpent))}
          icon={DollarSign}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          subtitle={totalBudgeted > 0 ? `${100 - spendPercent}% remaining` : "Set budgets to track"}
        />
        <MetricCard
          title="Savings This Period"
          value={formatCurrency(Math.max(0, remaining))}
          icon={PiggyBank}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-50 dark:bg-purple-500/10"
          subtitle={`${Math.max(0, savingsRate).toFixed(1)}% of income`}
          trend={
            income > 0
              ? { value: `${Math.max(0, savingsRate).toFixed(0)}%`, positive: savingsRate >= 20 }
              : undefined
          }
        />
      </div>

      {/* Overall progress */}
      {totalBudgeted > 0 && (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Overall Budget Progress
            </p>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                spendPercent >= 100
                  ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                  : spendPercent >= 85
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {spendPercent}% used
            </span>
          </div>
          <ProgressBar value={spendPercent} exceeded={spendPercent >= 100} height="h-3" />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              <PrivacyValue>{formatCurrency(totalSpent)}</PrivacyValue> spent
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              <PrivacyValue>{formatCurrency(totalBudgeted)}</PrivacyValue> budget
            </span>
          </div>
        </div>
      )}

      {/* Charts + Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Spending by Category
          </h3>
          <SpendingPieChart />
        </div>
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Budget vs. Actual
          </h3>
          <BudgetVsActualChart />
        </div>
        <BudgetHealthScore />
      </div>

      {/* Daily spending + Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Daily Spending — {periodLabel}
          </h3>
          <DailySpendingChart />
        </div>

        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Top Categories
            </h3>
            <Link
              href="/budgets"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {topCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">No spending yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topCategories.map((cat) => {
                const pct = getPercentage(cat.spent, cat.budget);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{CATEGORY_ICONS[cat.icon] || "💰"}</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        <PrivacyValue>{formatCurrency(cat.spent)}</PrivacyValue>
                      </span>
                    </div>
                    <ProgressBar
                      value={pct}
                      exceeded={cat.budget > 0 && cat.spent > cat.budget}
                      height="h-1.5"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Recent Expenses
          </h3>
          <Link
            href="/expenses"
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <ExpenseList
          onEdit={(expense) => {
            setEditExpense(expense);
            setExpenseModalOpen(true);
          }}
          maxItems={5}
        />
      </div>

      {/* Archive / Reset */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Period Reset
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Archive {periodLabel} and advance to the next period
          </p>
        </div>
        {archiveConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setArchiveConfirm(false)}
              className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                archiveCurrentPeriod();
                setArchiveConfirm(false);
              }}
              className="text-xs px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
            >
              Confirm Archive
            </button>
          </div>
        ) : (
          <button
            onClick={() => setArchiveConfirm(true)}
            className="flex items-center gap-2 text-xs px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Archive Period
          </button>
        )}
      </div>

      <AddExpenseModal
        open={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditExpense(null);
        }}
        editExpense={editExpense}
      />
    </div>
  );
}
