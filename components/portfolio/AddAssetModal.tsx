"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  usePortfolioStore,
  Asset,
  AssetCategory,
  ASSET_CATEGORY_META,
} from "@/store/usePortfolioStore";
import { formatCurrency } from "@/utils/formatters";
import {
  X,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle,
} from "lucide-react";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

interface LiveQuote {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  name: string;
}

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

const LIVE_CATEGORIES: AssetCategory[] = ["investment", "crypto", "retirement"];

export function AddAssetModal({ open, onClose, editAsset }: AddAssetModalProps) {
  const { addAsset, updateAsset } = usePortfolioStore();

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("cash");
  const [value, setValue] = useState("");
  const [shares, setShares] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [institution, setInstitution] = useState("");
  const [note, setNote] = useState("");

  // Ticker search state
  const [tickerQuery, setTickerQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [liveQuote, setLiveQuote] = useState<LiveQuote | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isStockLike = LIVE_CATEGORIES.includes(category);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    if (editAsset) {
      setName(editAsset.name);
      setCategory(editAsset.category);
      setValue(editAsset.value.toString());
      setShares(editAsset.shares?.toString() || "");
      setPricePerShare(editAsset.pricePerShare?.toString() || "");
      setInstitution(editAsset.institution || "");
      setNote(editAsset.note || "");
      if (editAsset.ticker) {
        setSelectedTicker(editAsset.ticker);
        setTickerQuery(editAsset.ticker);
        setIsLive(true);
      } else {
        setSelectedTicker("");
        setTickerQuery("");
        setIsLive(false);
      }
      setLiveQuote(null);
    } else {
      setName(""); setCategory("cash"); setValue(""); setShares("");
      setPricePerShare(""); setInstitution(""); setNote("");
      setSelectedTicker(""); setTickerQuery(""); setLiveQuote(null);
      setIsLive(false); setPriceError(null);
    }
    setSearchResults([]); setShowDropdown(false);
  }, [editAsset, open]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced ticker search
  const handleTickerInput = useCallback((q: string) => {
    setTickerQuery(q);
    setSelectedTicker("");
    setIsLive(false);
    setLiveQuote(null);
    setPriceError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/stock-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(data.quotes ?? []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  // Fetch live price for selected ticker
  async function fetchLivePrice(symbol: string) {
    setFetchingPrice(true);
    setPriceError(null);
    try {
      const res = await fetch(`/api/stock-price?symbols=${encodeURIComponent(symbol)}`);
      const data = await res.json();
      const q = data[symbol];
      if (!q || q.price === 0) {
        setPriceError(`No price data found for ${symbol}`);
        return;
      }
      setLiveQuote(q);
      const priceStr = q.price.toFixed(2);
      setPricePerShare(priceStr);
      // Auto-calculate value if shares are set
      if (shares) {
        const computed = parseFloat(shares) * q.price;
        if (!isNaN(computed)) setValue(computed.toFixed(2));
      }
    } catch {
      setPriceError("Failed to fetch price. You can enter it manually.");
    } finally {
      setFetchingPrice(false);
    }
  }

  // Select a ticker from search results
  function selectTicker(result: SearchResult) {
    setSelectedTicker(result.symbol);
    setTickerQuery(result.symbol);
    setShowDropdown(false);
    setSearchResults([]);
    setIsLive(true);
    // Auto-fill name if empty
    if (!name.trim()) setName(result.name);
    // Fetch live price
    fetchLivePrice(result.symbol);
  }

  // Recalculate value when shares or price changes
  function handleSharesChange(v: string) {
    setShares(v);
    const p = parseFloat(pricePerShare);
    const s = parseFloat(v);
    if (!isNaN(p) && !isNaN(s)) setValue((p * s).toFixed(2));
  }

  function handlePriceChange(v: string) {
    setPricePerShare(v);
    const p = parseFloat(v);
    const s = parseFloat(shares);
    if (!isNaN(p) && !isNaN(s)) setValue((p * s).toFixed(2));
    // Detach from live if user edits manually
    if (isLive) setIsLive(false);
  }

  // Refresh live price
  async function handleRefreshPrice() {
    if (!selectedTicker) return;
    await fetchLivePrice(selectedTicker);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (!name.trim() || isNaN(numValue) || numValue < 0) return;

    const data: Omit<Asset, "id" | "updatedAt"> = {
      name: name.trim(),
      category,
      value: numValue,
      ticker: selectedTicker || undefined,
      shares: shares ? parseFloat(shares) : undefined,
      pricePerShare: pricePerShare ? parseFloat(pricePerShare) : undefined,
      institution: institution.trim() || undefined,
      note: note.trim() || undefined,
    };

    if (editAsset) updateAsset(editAsset.id, data);
    else addAsset(data);
    onClose();
  };

  const meta = ASSET_CATEGORY_META[category];
  const calcValue = shares && pricePerShare
    ? (parseFloat(shares) * parseFloat(pricePerShare))
    : null;

  if (!open) return null;

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
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Asset Type Grid */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Asset Type
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {(Object.keys(ASSET_CATEGORY_META) as AssetCategory[]).map((cat) => {
                const m = ASSET_CATEGORY_META[cat];
                return (
                  <button key={cat} type="button"
                    onClick={() => { setCategory(cat); setSelectedTicker(""); setTickerQuery(""); setLiveQuote(null); setIsLive(false); }}
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

          {/* Ticker Search (stock-like categories) */}
          {isStockLike && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {meta.icon} Live Tracking
                </p>
                {isLive && liveQuote && (
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3" /> Live
                    </span>
                    <button
                      type="button"
                      onClick={handleRefreshPrice}
                      disabled={fetchingPrice}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {fetchingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : "↻ refresh"}
                    </button>
                  </div>
                )}
              </div>

              {/* Ticker search input */}
              <div ref={searchRef} className="relative">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Search Symbol or Company Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={category === "crypto" ? "BTC, ETH, SOL…" : "AAPL, Tesla, S&P 500…"}
                    value={tickerQuery}
                    onChange={(e) => handleTickerInput(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    className={`w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      isLive
                        ? "border-emerald-300 dark:border-emerald-500/50"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {searching || fetchingPrice ? (
                      <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                    ) : isLive ? (
                      <span className="text-emerald-500">✓</span>
                    ) : null}
                  </div>
                </div>

                {/* Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {searchResults.map((result) => (
                      <button
                        key={result.symbol}
                        type="button"
                        onClick={() => selectTicker(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              {result.symbol}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                              {result.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {result.name} · {result.exchange}
                          </p>
                        </div>
                        <span className="text-xs text-indigo-500 shrink-0">Select →</span>
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && !searching && searchResults.length === 0 && tickerQuery.length > 1 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 px-4 py-3 text-sm text-slate-400">
                    No results for &ldquo;{tickerQuery}&rdquo;
                  </div>
                )}
              </div>

              {/* Live quote display */}
              {isLive && liveQuote && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{liveQuote.name}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {liveQuote.currency === "USD" ? "$" : ""}{liveQuote.price.toFixed(2)}
                      <span className="text-xs font-normal text-slate-400 ml-1">{liveQuote.currency}</span>
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-xl ${
                    liveQuote.change >= 0
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                      : "text-red-500 bg-red-50 dark:bg-red-500/10"
                  }`}>
                    {liveQuote.change >= 0
                      ? <TrendingUp className="w-3.5 h-3.5" />
                      : <TrendingDown className="w-3.5 h-3.5" />}
                    {liveQuote.change >= 0 ? "+" : ""}{liveQuote.changePercent.toFixed(2)}%
                  </div>
                </div>
              )}

              {priceError && (
                <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {priceError}
                </div>
              )}

              {/* Shares + Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Shares / Units
                  </label>
                  <input
                    type="number" step="any" min="0" placeholder="0"
                    value={shares}
                    onChange={(e) => handleSharesChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Price / Unit {isLive && <span className="text-emerald-500">(live)</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number" step="any" min="0" placeholder="0.00"
                      value={pricePerShare}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className={`w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isLive && liveQuote ? "border-emerald-300 dark:border-emerald-500/50" : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {calcValue !== null && !isNaN(calcValue) && calcValue > 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-3 h-3" />
                  Auto-calculated value: <span className="font-bold">{formatCurrency(calcValue)}</span>
                </div>
              )}
            </div>
          )}

          {/* Name */}
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
            />
          </div>

          {/* Current Value */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Current Value
              {isStockLike && shares && pricePerShare && (
                <span className="ml-2 text-xs text-slate-400 font-normal">(auto-calculated from shares × price)</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">$</span>
              <input
                type="number" step="0.01" min="0" placeholder="0.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Institution + Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Institution <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text" placeholder="e.g. Fidelity, Chase"
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
                type="text" placeholder="Any notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isLive && <Zap className="w-4 h-4" />}
              {editAsset ? "Save Changes" : "Add Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
