"use client";

import { useState, useEffect } from "react";
import {
  usePortfolioStore,
  Liability,
  LiabilityCategory,
  LIABILITY_CATEGORY_META,
} from "@/store/usePortfolioStore";
import { X } from "lucide-react";

interface AddLiabilityModalProps {
  open: boolean;
  onClose: () => void;
  editLiability?: Liability | null;
}

export function AddLiabilityModal({
  open,
  onClose,
  editLiability,
}: AddLiabilityModalProps) {
  const { addLiability, updateLiability } = usePortfolioStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<LiabilityCategory>("credit-card");
  const [balance, setBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [institution, setInstitution] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editLiability) {
      setName(editLiability.name);
      setCategory(editLiability.category);
      setBalance(editLiability.balance.toString());
      setInterestRate(editLiability.interestRate?.toString() || "");
      setMinimumPayment(editLiability.minimumPayment?.toString() || "");
      setInstitution(editLiability.institution || "");
      setNote(editLiability.note || "");
    } else {
      setName("");
      setCategory("credit-card");
      setBalance("");
      setInterestRate("");
      setMinimumPayment("");
      setInstitution("");
      setNote("");
    }
  }, [editLiability, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance);
    if (!name.trim() || isNaN(numBalance) || numBalance < 0) return;

    const data: Omit<Liability, "id" | "updatedAt"> = {
      name: name.trim(),
      category,
      balance: numBalance,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      minimumPayment: minimumPayment ? parseFloat(minimumPayment) : undefined,
      institution: institution.trim() || undefined,
      note: note.trim() || undefined,
    };

    if (editLiability) {
      updateLiability(editLiability.id, data);
    } else {
      addLiability(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editLiability ? "Edit Liability" : "Add Liability"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Track a debt or outstanding balance
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
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Liability Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(LIABILITY_CATEGORY_META) as LiabilityCategory[]).map((cat) => {
                const m = LIABILITY_CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                      category === cat
                        ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/10"
                        : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                    }`}
                  >
                    <span className="text-lg leading-none">{m.icon}</span>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight">
                      {m.label.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              placeholder={`e.g. Chase Sapphire Card`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              required
              autoFocus
            />
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Outstanding Balance
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Interest + Minimum Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Interest Rate <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full pl-4 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Min. Payment <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={minimumPayment}
                  onChange={(e) => setMinimumPayment(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Institution + Note */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Institution <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chase, Sallie Mae"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Note <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Any notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
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
              className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all"
            >
              {editLiability ? "Save Changes" : "Add Liability"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
