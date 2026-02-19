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
  Pencil,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Expense } from "@/store/useBudgetStore";

export default function Dashboard() {
  const {
    income,
    savingsGoal,
    setIncome,
    setSavingsGoal,
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
  const [editingSavings, setEditingSavings] = useState(false);
  const [savingsInput, setSavingsInput] = useState(savingsGoal.toString());
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  const totalBudgeted = getTotalBudgeted();
  const totalSpent = getTotalSpent();
  // Income flow: Income → Savings Allocation → Available to Budget → Expenses
  const availableToBudget = income - savingsGoal;
  const remaining = availableToBudget - totalSpent;
  const savingsRate = income > 0 ? (savingsGoal / income) * 100 : 0;
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
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3 mb-3">
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
          <PeriodPicker />
        </div>
        <button
          onClick={() => setExpenseModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Add Expense
        </button>
      </div>

      {/* Income Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 mb-6 shadow-xl shadow-indigo-500/20">
        {/* Top row: Income + Savings Goal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-indigo-200 text-xs font-medium mb-1 uppercase tracking-wide">Monthly Income</p>
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
                  className="bg-white/20 text-white font-bold text-2xl w-full max-w-[160px] rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-white/50"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => { setIncomeInput(income.toString()); setEditingIncome(true); }}
                className="flex items-center gap-2 text-white font-bold text-2xl hover:text-white/80 transition-colors group"
              >
                <PrivacyValue>{formatCurrency(income)}</PrivacyValue>
                <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
              </button>
            )}
          </div>

          {/* Savings Goal */}
          <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <PiggyBank className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">Savings Goal</p>
              {editingSavings ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-white font-bold">$</span>
                  <input
                    type="number"
                    value={savingsInput}
                    onChange={(e) => setSavingsInput(e.target.value)}
                    onBlur={() => {
                      const val = parseFloat(savingsInput);
                      if (!isNaN(val) && val >= 0) setSavingsGoal(val);
                      setEditingSavings(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseFloat(savingsInput);
                        if (!isNaN(val) && val >= 0) setSavingsGoal(val);
                        setEditingSavings(false);
                      }
                    }}
                    className="bg-white/20 text-white font-bold w-full max-w-[120px] rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                    autoFocus
                  />
                  <button onClick={() => { const val = parseFloat(savingsInput); if (!isNaN(val) && val >= 0) setSavingsGoal(val); setEditingSavings(false); }}>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setSavingsInput(savingsGoal.toString()); setEditingSavings(true); }}
                  className="flex items-center gap-1.5 group mt-0.5"
                >
                  <span className="text-emerald-300 font-bold text-sm">
                    <PrivacyValue>{formatCurrency(savingsGoal)}</PrivacyValue>
                  </span>
                  <Pencil className="w-3 h-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Income flow bar */}
        <div className="mb-4">
          <div className="flex h-3 rounded-full overflow-hidden bg-white/10">
            {/* Savings slice */}
            {income > 0 && savingsGoal > 0 && (
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (savingsGoal / income) * 100)}%` }}
                title={`Savings: ${formatCurrency(savingsGoal)}`}
              />
            )}
            {/* Spent slice */}
            {income > 0 && totalSpent > 0 && (
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalSpent / income) * 100)}%` }}
                title={`Spent: ${formatCurrency(totalSpent)}`}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-indigo-200">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Savings <PrivacyValue>{formatCurrency(savingsGoal)}</PrivacyValue></span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Spent <PrivacyValue>{formatCurrency(totalSpent)}</PrivacyValue></span>
            <span className="flex items-center gap-1.5 sm:ml-auto"><span className="w-2 h-2 rounded-full bg-white/30 inline-block" />Remaining <PrivacyValue>{formatCurrency(Math.max(0, remaining))}</PrivacyValue></span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
            <p className="text-indigo-200 text-xs font-medium">Available to Budget</p>
            <p className="text-white font-bold mt-0.5">
              <PrivacyValue>{formatCurrency(availableToBudget)}</PrivacyValue>
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
            <p className="text-indigo-200 text-xs font-medium">Spent This Period</p>
            <p className="text-white font-bold mt-0.5">
              <PrivacyValue>{formatCurrency(totalSpent)}</PrivacyValue>
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
            <p className="text-indigo-200 text-xs font-medium">Savings Rate</p>
            <p className={`font-bold mt-0.5 ${savingsRate >= 20 ? "text-emerald-300" : "text-white"}`}>
              <PrivacyValue>{savingsRate.toFixed(1)}%</PrivacyValue>
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          title="Savings Goal"
          value={formatCurrency(savingsGoal)}
          icon={PiggyBank}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          subtitle={income > 0 ? `${savingsRate.toFixed(1)}% of income` : "Set a savings goal"}
          trend={
            income > 0
              ? { value: `${savingsRate.toFixed(0)}%`, positive: savingsRate >= 20 }
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
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
