"use client";

import { useState } from "react";
import {
  usePortfolioStore,
  Asset,
  Liability,
  AssetCategory,
  LiabilityCategory,
  ASSET_CATEGORY_META,
  LIABILITY_CATEGORY_META,
} from "@/store/usePortfolioStore";
import { formatCurrency } from "@/utils/formatters";
import { PrivacyValue } from "@/components/PrivacyValue";
import { AddAssetModal } from "@/components/portfolio/AddAssetModal";
import { AddLiabilityModal } from "@/components/portfolio/AddLiabilityModal";
import {
  AssetAllocationChart,
  NetWorthHistoryChart,
} from "@/components/portfolio/PortfolioCharts";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Building2,
  RefreshCw,
} from "lucide-react";

function NetWorthBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
        isPositive
          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
          : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {isPositive ? "Positive" : "Negative"} Net Worth
    </span>
  );
}

interface AssetRowProps {
  asset: Asset;
  onEdit: (a: Asset) => void;
  onDelete: (id: string) => void;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
}

function AssetRow({ asset, onEdit, onDelete, confirmDelete, setConfirmDelete }: AssetRowProps) {
  const meta = ASSET_CATEGORY_META[asset.category];
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ backgroundColor: `${meta.color}18` }}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {asset.name}
          {asset.ticker && (
            <span className="ml-2 text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {asset.ticker}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
          >
            {meta.label}
          </span>
          {asset.institution && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {asset.institution}
            </span>
          )}
          {asset.shares && asset.pricePerShare && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {asset.shares.toLocaleString()} shares @ {formatCurrency(asset.pricePerShare)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <PrivacyValue>{formatCurrency(asset.value)}</PrivacyValue>
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(asset)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirmDelete === asset.id) {
                onDelete(asset.id);
                setConfirmDelete(null);
              } else {
                setConfirmDelete(asset.id);
                setTimeout(() => setConfirmDelete(null), 3000);
              }
            }}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              confirmDelete === asset.id
                ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                : "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface LiabilityRowProps {
  liability: Liability;
  onEdit: (l: Liability) => void;
  onDelete: (id: string) => void;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
}

function LiabilityRow({ liability, onEdit, onDelete, confirmDelete, setConfirmDelete }: LiabilityRowProps) {
  const meta = LIABILITY_CATEGORY_META[liability.category];
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ backgroundColor: "#ef444418" }}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {liability.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
            {meta.label}
          </span>
          {liability.institution && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {liability.institution}
            </span>
          )}
          {liability.interestRate !== undefined && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {liability.interestRate}% APR
            </span>
          )}
          {liability.minimumPayment !== undefined && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Min: {formatCurrency(liability.minimumPayment)}/mo
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-red-500 dark:text-red-400">
          <PrivacyValue>-{formatCurrency(liability.balance)}</PrivacyValue>
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(liability)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirmDelete === liability.id) {
                onDelete(liability.id);
                setConfirmDelete(null);
              } else {
                setConfirmDelete(liability.id);
                setTimeout(() => setConfirmDelete(null), 3000);
              }
            }}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              confirmDelete === liability.id
                ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                : "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const {
    assets,
    liabilities,
    getTotalAssets,
    getTotalLiabilities,
    getNetWorth,
    getAssetsByCategory,
    getLiabilitiesByCategory,
    deleteAsset,
    deleteLiability,
    takeSnapshot,
    refreshStockPrices,
  } = usePortfolioStore();

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [liabilityModalOpen, setLiabilityModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [editLiability, setEditLiability] = useState<Liability | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ updated: number; errors: string[] } | null>(null);

  const stockAssetCount = assets.filter((a) => a.ticker && a.shares && a.shares > 0).length;

  async function handleRefreshPrices() {
    setRefreshing(true);
    setRefreshResult(null);
    const result = await refreshStockPrices();
    setRefreshing(false);
    setRefreshResult(result);
    setTimeout(() => setRefreshResult(null), 5000);
  }

  const totalAssets = getTotalAssets();
  const totalLiabilities = getTotalLiabilities();
  const netWorth = getNetWorth();
  const assetsByCategory = getAssetsByCategory();
  const liabilitiesByCategory = getLiabilitiesByCategory();

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Group assets by category
  const assetGroups = (Object.keys(ASSET_CATEGORY_META) as AssetCategory[])
    .map((cat) => ({
      category: cat,
      meta: ASSET_CATEGORY_META[cat],
      total: assetsByCategory[cat],
      items: assets.filter((a) => a.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  // Group liabilities by category
  const liabilityGroups = (Object.keys(LIABILITY_CATEGORY_META) as LiabilityCategory[])
    .map((cat) => ({
      category: cat,
      meta: LIABILITY_CATEGORY_META[cat],
      total: liabilitiesByCategory[cat],
      items: liabilities.filter((l) => l.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const totalMinPayments = liabilities.reduce(
    (sum, l) => sum + (l.minimumPayment || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Portfolio
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Your complete financial picture
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh stock prices */}
          {stockAssetCount > 0 && (
            <button
              onClick={handleRefreshPrices}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all text-sm disabled:opacity-60"
              title="Refresh stock prices from Yahoo Finance"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Live Prices"}
            </button>
          )}
          <button
            onClick={() => takeSnapshot()}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
            title="Save today's snapshot"
          >
            <RefreshCw className="w-4 h-4" />
            Snapshot
          </button>
          <button
            onClick={() => {
              setEditLiability(null);
              setLiabilityModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Liability
          </button>
          <button
            onClick={() => {
              setEditAsset(null);
              setAssetModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Stock refresh result */}
      {refreshResult && (
        <div className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
          refreshResult.errors.length > 0
            ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
            : "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
        }`}>
          <RefreshCw className="w-4 h-4 shrink-0" />
          {refreshResult.errors.length === 0
            ? `Updated ${refreshResult.updated} stock price${refreshResult.updated !== 1 ? "s" : ""} from Yahoo Finance`
            : `Updated ${refreshResult.updated}, errors: ${refreshResult.errors.join(", ")}`}
        </div>
      )}

      {/* Net Worth Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-8 mb-6 overflow-hidden shadow-2xl">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              <p className="text-slate-300 text-sm font-medium">Total Net Worth</p>
            </div>
            <p
              className={`text-5xl font-bold tracking-tight mb-3 ${
                netWorth >= 0 ? "text-white" : "text-red-400"
              }`}
            >
              <PrivacyValue>{netWorth < 0 ? "-" : ""}{formatCurrency(Math.abs(netWorth))}</PrivacyValue>
            </p>
              <NetWorthBadge value={netWorth} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 min-w-[140px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-slate-300 text-xs font-medium">Total Assets</p>
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  <PrivacyValue>{formatCurrency(totalAssets)}</PrivacyValue>
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {assets.length} item{assets.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 min-w-[140px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <p className="text-slate-300 text-xs font-medium">Total Liabilities</p>
                </div>
                <p className="text-2xl font-bold text-red-400">
                  <PrivacyValue>{formatCurrency(totalLiabilities)}</PrivacyValue>
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {liabilities.length} item{liabilities.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Asset bar */}
          {totalAssets > 0 && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Asset breakdown</span>
                <span>{formatCurrency(totalAssets)} total</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {assetGroups.map((g) => (
                  <div
                    key={g.category}
                    className="rounded-full transition-all duration-700"
                    style={{
                      width: `${(g.total / totalAssets) * 100}%`,
                      backgroundColor: g.meta.color,
                    }}
                    title={`${g.meta.label}: ${formatCurrency(g.total)}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                {assetGroups.map((g) => (
                  <div key={g.category} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.meta.color }} />
                    {g.meta.label} {((g.total / totalAssets) * 100).toFixed(0)}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Cash & Bank",
            value: assetsByCategory.cash,
            icon: "💵",
            color: "emerald",
          },
          {
            label: "Investments",
            value: assetsByCategory.investment + assetsByCategory.retirement + assetsByCategory.crypto,
            icon: "📈",
            color: "indigo",
          },
          {
            label: "Real Assets",
            value: assetsByCategory["real-estate"] + assetsByCategory.vehicle + assetsByCategory.business,
            icon: "🏠",
            color: "amber",
          },
          {
            label: "Min. Payments/mo",
            value: totalMinPayments,
            icon: "💳",
            color: "red",
            isLiability: true,
          },
        ].map(({ label, value, icon, color, isLiability }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-lg transition-all duration-300"
          >
            <div
              className={`w-9 h-9 bg-${color}-50 dark:bg-${color}-500/10 rounded-xl flex items-center justify-center mb-3 text-lg`}
            >
              {icon}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{label}</p>
            <p
              className={`text-xl font-bold ${
                isLiability
                  ? "text-red-500 dark:text-red-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {value > 0 ? <PrivacyValue>{formatCurrency(value)}</PrivacyValue> : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Asset Allocation
          </h3>
          <AssetAllocationChart />
        </div>
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Net Worth History
          </h3>
          <NetWorthHistoryChart />
        </div>
      </div>

      {/* Assets section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Assets</h2>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <PrivacyValue>{formatCurrency(totalAssets)}</PrivacyValue>
            </span>
          </div>
          <button
            onClick={() => {
              setEditAsset(null);
              setAssetModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Asset
          </button>
        </div>

        {assets.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No assets yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 mb-4">
              Add your first asset to start tracking your net worth
            </p>
            <button
              onClick={() => { setEditAsset(null); setAssetModalOpen(true); }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              Add First Asset
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {assetGroups.map((group) => {
              const collapsed = collapsedCategories.has(group.category);
              return (
                <div
                  key={group.category}
                  className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden"
                >
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(group.category)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                        style={{ backgroundColor: `${group.meta.color}18` }}
                      >
                        {group.meta.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {group.meta.label}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <PrivacyValue>{formatCurrency(group.total)}</PrivacyValue>
                      </span>
                      {collapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Items */}
                  {!collapsed && (
                    <div className="border-t border-slate-100 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700/60">
                      {group.items.map((asset) => (
                        <AssetRow
                          key={asset.id}
                          asset={asset}
                          onEdit={(a) => { setEditAsset(a); setAssetModalOpen(true); }}
                          onDelete={deleteAsset}
                          confirmDelete={confirmDelete}
                          setConfirmDelete={setConfirmDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Liabilities section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Liabilities</h2>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full">
              <PrivacyValue>{formatCurrency(totalLiabilities)}</PrivacyValue>
            </span>
          </div>
          <button
            onClick={() => {
              setEditLiability(null);
              setLiabilityModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Liability
          </button>
        </div>

        {liabilities.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No liabilities tracked</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              Add loans, credit cards, or other debts to get your true net worth
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {liabilityGroups.map((group) => {
              const collapsed = collapsedCategories.has(`lib-${group.category}`);
              return (
                <div
                  key={group.category}
                  className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden"
                >
                  <button
                    onClick={() => toggleCategory(`lib-${group.category}`)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm bg-red-50 dark:bg-red-500/10">
                        {group.meta.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {group.meta.label}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-red-500 dark:text-red-400">
                        <PrivacyValue>-{formatCurrency(group.total)}</PrivacyValue>
                      </span>
                      {collapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {!collapsed && (
                    <div className="border-t border-slate-100 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700/60">
                      {group.items.map((liability) => (
                        <LiabilityRow
                          key={liability.id}
                          liability={liability}
                          onEdit={(l) => { setEditLiability(l); setLiabilityModalOpen(true); }}
                          onDelete={deleteLiability}
                          confirmDelete={confirmDelete}
                          setConfirmDelete={setConfirmDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debt summary if any liabilities */}
      {liabilities.length > 0 && (
        <div className="mt-4 bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1">Debt-to-Asset Ratio</p>
            <p className={`text-lg font-bold ${totalAssets > 0 && totalLiabilities / totalAssets < 0.5 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              <PrivacyValue>{totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : "∞"}%</PrivacyValue>
            </p>
          </div>
          {totalMinPayments > 0 && (
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1">Total Min. Payments/mo</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                <PrivacyValue>{formatCurrency(totalMinPayments)}</PrivacyValue>
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1">Highest Interest</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {liabilities.some((l) => l.interestRate !== undefined)
                ? `${Math.max(...liabilities.filter((l) => l.interestRate !== undefined).map((l) => l.interestRate!))}% APR`
                : "—"}
            </p>
          </div>
        </div>
      )}

      <AddAssetModal
        open={assetModalOpen}
        onClose={() => { setAssetModalOpen(false); setEditAsset(null); }}
        editAsset={editAsset}
      />
      <AddLiabilityModal
        open={liabilityModalOpen}
        onClose={() => { setLiabilityModalOpen(false); setEditLiability(null); }}
        editLiability={editLiability}
      />
    </div>
  );
}
