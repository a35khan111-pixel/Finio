"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useBudgetStore, Expense } from "@/store/useBudgetStore";
import { formatCurrency, CATEGORY_ICONS } from "@/utils/formatters";
import { X, Plus, Zap } from "lucide-react";
import { PrivacyValue } from "./PrivacyValue";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

export function AddExpenseModal({
  open,
  onClose,
  editExpense,
}: AddExpenseModalProps) {
  const { categories, addExpense, updateExpense, getCategoryBudget, getCategorySpent } =
    useBudgetStore();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [shake, setShake] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (editExpense) {
      setAmount(editExpense.amount.toString());
      setCategoryId(editExpense.categoryId);
      setDate(editExpense.date);
      setNote(editExpense.note);
    } else {
      setAmount("");
      setCategoryId(categories[0]?.id || "");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setNote("");
    }
    setSubmitted(false);
  }, [editExpense, open, categories]);

  if (!open) return null;

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const budget = getCategoryBudget(categoryId);
  const spent = getCategorySpent(categoryId);
  const remaining = budget - spent;
  const wouldExceed =
    budget > 0 && parseFloat(amount || "0") > remaining;
  const isOverBudget = budget > 0 && spent > budget;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    if (wouldExceed && !submitted) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setSubmitted(true);
      return;
    }

    const expenseData = {
      amount: parseFloat(amount),
      categoryId,
      date,
      note,
    };

    if (editExpense) {
      updateExpense(editExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 transition-transform ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editExpense ? "Edit Expense" : "Add Expense"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {editExpense ? "Update the expense details" : "Track a new expense"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSubmitted(false);
                }}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 mt-2.5">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setAmount(q.toString());
                    setSubmitted(false);
                  }}
                  className="flex-1 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                >
                  ${q}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-xs font-medium ${
                    categoryId === cat.id
                      ? "border-current bg-current/10"
                      : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                  }`}
                  style={
                    categoryId === cat.id ? { color: cat.color, borderColor: cat.color } : {}
                  }
                >
                  <span className="text-lg leading-none">
                    {CATEGORY_ICONS[cat.icon] || "💰"}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 truncate w-full text-center text-[10px]">
                    {cat.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Budget status for selected category */}
          {selectedCategory && budget > 0 && (
            <div
              className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
                isOverBudget || wouldExceed
                  ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <Zap className="w-4 h-4 shrink-0" />
              <div>
                {wouldExceed ? (
                  <span className="font-medium">
                    This will exceed your {selectedCategory.name} budget by{" "}
                    <PrivacyValue>{formatCurrency(parseFloat(amount || "0") - remaining)}</PrivacyValue>!
                  </span>
                ) : (
                  <span>
                    <span className="font-medium">
                      <PrivacyValue>{formatCurrency(remaining)}</PrivacyValue>
                    </span>{" "}
                    remaining in {selectedCategory.name}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Note{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="What was this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                wouldExceed && !submitted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"
              }`}
            >
              <Plus className="w-4 h-4" />
              {editExpense
                ? "Save Changes"
                : wouldExceed && !submitted
                ? "Add Anyway"
                : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
