"use client";

import { useState, useEffect } from "react";
import {
  usePortfolioStore,
  Asset,
  AssetCategory,
  ASSET_CATEGORY_META,
} from "@/store/usePortfolioStore";
import { formatCurrency } from "@/utils/formatters";
import { X, RefreshCw } from "lucide-react";

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
  editAsset?: Asset | null;
}

const ASSET_SUBTYPES: Record<AssetCategory, string[]> = {
  cash: ["Checking", "Savings", "Money Market", "CD", "Cash"],
  investment: ["Stocks", "ETFs", "Mutual Funds", "Bonds", "Options", "Index Fund"],
  retirement: ["401(k)", "IRA", "Roth IRA", "403(b)", "Pension", "HSA"],
  "real-estate": ["Primary Home", "Rental Property", "REIT", "Land", "Commercial"],
  vehicle: ["Car", "Truck", "Motorcycle", "Boat", "RV", "Other"],
  crypto: ["Bitcoin", "Ethereum", "Altcoin", "Stablecoin", "DeFi", "NFT"],
  business: ["Business Equity", "Private Investment", "Partnership", "LLC"],
  other: ["Jewelry", "Art", "Collectibles", "Equipment", "Receivable", "Other"],
};

export function AddAssetModal({ open, onClose, editAsset }: AddAssetModalProps) {
  const { addAsset, updateAsset } = usePortfolioStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("cash");
  const [subtype, setSubtype] = useState("");
  const [value, setValue] = useState("");
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [institution, setInstitution] = useState("");
  const [note, setNote] = useState("");

  const isStockLike =
    category === "investment" || category === "crypto" || category === "retirement";

  useEffect(() => {
    if (!open) return;
    if (editAsset) {
      setName(editAsset.name);
      setCategory(editAsset.category);
      setSubtype(editAsset.ticker ? "" : "");
      setValue(editAsset.value.toString());
      setTicker(editAsset.ticker || "");
      setShares(editAsset.shares?.toString() || "");
      setPricePerShare(editAsset.pricePerShare?.toString() || "");
      setInstitution(editAsset.institution || "");
      setNote(editAsset.note || "");
    } else {
      setName("");
      setCategory("cash");
      setSubtype("");
      setValue("");
      setTicker("");
      setShares("");
      setPricePerShare("");
      setInstitution("");
      setNote("");
    }
  }, [editAsset, open]);

  if (!open) return null;

  // Auto-calculate value from shares × price
  const calcValue =
    shares && pricePerShare
      ? (parseFloat(shares) * parseFloat(pricePerShare)).toFixed(2)
      : "";

  const handleSharesOrPriceChange = (s: string, p: string) => {
    if (s && p) {
      const computed = parseFloat(s) * parseFloat(p);
      if (!isNaN(computed)) setValue(computed.toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (!name.trim() || isNaN(numValue) || numValue < 0) return;

    const data: Omit<Asset, "id" | "updatedAt"> = {
      name: name.trim(),
      category,
      value: numValue,
      ticker: ticker.trim().toUpperCase() || undefined,
      shares: shares ? parseFloat(shares) : undefined,
      pricePerShare: pricePerShare ? parseFloat(pricePerShare) : undefined,
      institution: institution.trim() || undefined,
      note: note.trim() || undefined,
    };

    if (editAsset) {
      updateAsset(editAsset.id, data);
    } else {
      addAsset(data);
    }
    onClose();
  };

  const meta = ASSET_CATEGORY_META[category];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editAsset ? "Edit Asset" : "Add Asset"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {editAsset ? "Update asset details" : "Track a new asset"}
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
              Asset Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(ASSET_CATEGORY_META) as AssetCategory[]).map((cat) => {
                const m = ASSET_CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setSubtype("");
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                      category === cat
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
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

          {/* Subtype */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Asset Name
              </label>
              <input
                type="text"
                placeholder={`e.g. ${ASSET_SUBTYPES[category][0]}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Subtype
              </label>
              <select
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Select subtype</option>
                {ASSET_SUBTYPES[category].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* For investment/crypto: ticker, shares, price */}
          {isStockLike && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {meta.icon} Holdings (optional)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Ticker / Symbol
                  </label>
                  <input
                    type="text"
                    placeholder="AAPL"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Shares / Units
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={shares}
                    onChange={(e) => {
                      setShares(e.target.value);
                      handleSharesOrPriceChange(e.target.value, pricePerShare);
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Price / Unit
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={pricePerShare}
                      onChange={(e) => {
                        setPricePerShare(e.target.value);
                        handleSharesOrPriceChange(shares, e.target.value);
                      }}
                      className="w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              {calcValue && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <RefreshCw className="w-3 h-3" />
                  Auto-calculated value: <span className="font-bold">{formatCurrency(parseFloat(calcValue))}</span>
                </div>
              )}
            </div>
          )}

          {/* Current Value */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Current Value
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
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
                placeholder="e.g. Fidelity, Chase"
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
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              {editAsset ? "Save Changes" : "Add Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
