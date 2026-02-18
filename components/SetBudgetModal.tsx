"use client";

import { useState, useEffect } from "react";
import { useBudgetStore, Category } from "@/store/useBudgetStore";
import { CATEGORY_ICONS, PRESET_COLORS } from "@/utils/formatters";
import { X, Check } from "lucide-react";

interface SetBudgetModalProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

const ICON_OPTIONS = Object.keys(CATEGORY_ICONS);

export function SetBudgetModal({ open, onClose, category }: SetBudgetModalProps) {
  const { setBudget, addCategory, getCategoryBudget } = useBudgetStore();

  const existingBudget = category ? getCategoryBudget(category.id) : 0;

  const [budgetAmount, setBudgetAmount] = useState("");
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(PRESET_COLORS[0]);
  const [catIcon, setCatIcon] = useState(ICON_OPTIONS[0]);

  const isNewCategory = !category;

  useEffect(() => {
    if (!open) return;
    if (category) {
      setBudgetAmount(existingBudget > 0 ? existingBudget.toString() : "");
    } else {
      setBudgetAmount("");
      setCatName("");
      setCatColor(PRESET_COLORS[0]);
      setCatIcon(ICON_OPTIONS[0]);
    }
  }, [category, open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isNewCategory) {
      if (!catName.trim()) return;
      addCategory({ name: catName.trim(), color: catColor, icon: catIcon });
    } else if (category) {
      const amount = parseFloat(budgetAmount);
      if (!isNaN(amount) && amount >= 0) {
        setBudget(category.id, amount);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {category ? `Edit Budget — ${category.name}` : "New Category"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {category ? "Set your monthly budget" : "Create a new spending category"}
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
          {isNewCategory && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Groceries"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCatColor(color)}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      {catColor === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCatIcon(icon)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                        catIcon === icon
                          ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {CATEGORY_ICONS[icon]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Monthly Budget{" "}
              {isNewCategory && (
                <span className="text-slate-400 font-normal">(optional)</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
                $
              </span>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required={!isNewCategory}
                autoFocus={!isNewCategory}
              />
            </div>
          </div>

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
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
            >
              {category ? "Save Budget" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
