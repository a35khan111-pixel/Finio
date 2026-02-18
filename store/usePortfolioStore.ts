"use client";

import { create } from "zustand";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

export type AssetCategory =
  | "cash"
  | "investment"
  | "retirement"
  | "real-estate"
  | "vehicle"
  | "crypto"
  | "business"
  | "other";

export type LiabilityCategory =
  | "mortgage"
  | "auto-loan"
  | "credit-card"
  | "student-loan"
  | "personal-loan"
  | "medical"
  | "business-loan"
  | "other";

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  ticker?: string;
  shares?: number;
  pricePerShare?: number;
  institution?: string;
  note?: string;
  updatedAt: string;
}

export interface Liability {
  id: string;
  name: string;
  category: LiabilityCategory;
  balance: number;
  interestRate?: number;
  minimumPayment?: number;
  institution?: string;
  note?: string;
  updatedAt: string;
}

export interface NetWorthSnapshot {
  date: string; // "YYYY-MM-DD"
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface PortfolioStore {
  assets: Asset[];
  liabilities: Liability[];
  snapshots: NetWorthSnapshot[];
  userId: string | null;

  // Lifecycle
  loadAllData: (userId: string) => Promise<void>;
  clearData: () => void;

  // Asset actions
  addAsset: (asset: Omit<Asset, "id" | "updatedAt">) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Omit<Asset, "id">>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

  // Liability actions
  addLiability: (liability: Omit<Liability, "id" | "updatedAt">) => Promise<void>;
  updateLiability: (id: string, updates: Partial<Omit<Liability, "id">>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;

  // Snapshots
  takeSnapshot: () => Promise<void>;

  // Stock prices
  refreshStockPrices: () => Promise<{ updated: number; errors: string[] }>;

  // Computed
  getTotalAssets: () => number;
  getTotalLiabilities: () => number;
  getNetWorth: () => number;
  getAssetsByCategory: () => Record<AssetCategory, number>;
  getLiabilitiesByCategory: () => Record<LiabilityCategory, number>;
}

export const ASSET_CATEGORY_META: Record<
  AssetCategory,
  { label: string; icon: string; color: string }
> = {
  cash: { label: "Cash & Bank", icon: "💵", color: "#22c55e" },
  investment: { label: "Investments", icon: "📈", color: "#6366f1" },
  retirement: { label: "Retirement", icon: "🏦", color: "#8b5cf6" },
  "real-estate": { label: "Real Estate", icon: "🏠", color: "#f59e0b" },
  vehicle: { label: "Vehicles", icon: "🚗", color: "#06b6d4" },
  crypto: { label: "Crypto", icon: "₿", color: "#f97316" },
  business: { label: "Business", icon: "🏢", color: "#84cc16" },
  other: { label: "Other Assets", icon: "📦", color: "#94a3b8" },
};

export const LIABILITY_CATEGORY_META: Record<
  LiabilityCategory,
  { label: string; icon: string; color: string }
> = {
  mortgage: { label: "Mortgage", icon: "🏠", color: "#ef4444" },
  "auto-loan": { label: "Auto Loan", icon: "🚗", color: "#f97316" },
  "credit-card": { label: "Credit Card", icon: "💳", color: "#ec4899" },
  "student-loan": { label: "Student Loan", icon: "🎓", color: "#8b5cf6" },
  "personal-loan": { label: "Personal Loan", icon: "🤝", color: "#f59e0b" },
  medical: { label: "Medical Debt", icon: "🏥", color: "#ef4444" },
  "business-loan": { label: "Business Loan", icon: "🏢", color: "#6366f1" },
  other: { label: "Other Debt", icon: "📋", color: "#94a3b8" },
};

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as AssetCategory,
    value: parseFloat(String(row.value)),
    ticker: (row.ticker as string) || undefined,
    shares: row.shares != null ? parseFloat(String(row.shares)) : undefined,
    pricePerShare: row.price_per_share != null ? parseFloat(String(row.price_per_share)) : undefined,
    institution: (row.institution as string) || undefined,
    note: (row.note as string) || undefined,
    updatedAt: row.updated_at as string,
  };
}

function mapLiability(row: Record<string, unknown>): Liability {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as LiabilityCategory,
    balance: parseFloat(String(row.balance)),
    interestRate: row.interest_rate != null ? parseFloat(String(row.interest_rate)) : undefined,
    minimumPayment: row.minimum_payment != null ? parseFloat(String(row.minimum_payment)) : undefined,
    institution: (row.institution as string) || undefined,
    note: (row.note as string) || undefined,
    updatedAt: row.updated_at as string,
  };
}

function mapSnapshot(row: Record<string, unknown>): NetWorthSnapshot {
  return {
    date: row.date as string,
    totalAssets: parseFloat(String(row.total_assets)),
    totalLiabilities: parseFloat(String(row.total_liabilities)),
    netWorth: parseFloat(String(row.net_worth)),
  };
}

export const usePortfolioStore = create<PortfolioStore>()((set, get) => ({
  assets: [],
  liabilities: [],
  snapshots: [],
  userId: null,

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  loadAllData: async (userId) => {
    const client = createClient();
    const [assetsRes, liabilitiesRes, snapshotsRes] = await Promise.all([
      client.from("assets").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
      client.from("liabilities").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
      client.from("net_worth_snapshots").select("*").eq("user_id", userId).order("date"),
    ]);

    set({
      userId,
      assets: (assetsRes.data ?? []).map(mapAsset),
      liabilities: (liabilitiesRes.data ?? []).map(mapLiability),
      snapshots: (snapshotsRes.data ?? []).map(mapSnapshot),
    });
  },

  clearData: () => set({ assets: [], liabilities: [], snapshots: [], userId: null }),

  // ─── Assets ──────────────────────────────────────────────────────────────────

  addAsset: async (asset) => {
    const { userId } = get();
    if (!userId) return;
    const id = crypto.randomUUID();
    const updatedAt = new Date().toISOString();
    set((s) => ({ assets: [{ ...asset, id, updatedAt }, ...s.assets] }));

    const { error } = await createClient().from("assets").insert({
      id,
      user_id: userId,
      name: asset.name,
      category: asset.category,
      value: asset.value,
      ticker: asset.ticker ?? null,
      shares: asset.shares ?? null,
      price_per_share: asset.pricePerShare ?? null,
      institution: asset.institution ?? null,
      note: asset.note ?? null,
    });

    if (error) {
      set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
    } else {
      await get().takeSnapshot();
    }
  },

  updateAsset: async (id, updates) => {
    const prev = get().assets.find((a) => a.id === id);
    const updatedAt = new Date().toISOString();
    set((s) => ({
      assets: s.assets.map((a) => a.id === id ? { ...a, ...updates, updatedAt } : a),
    }));

    const dbUpdates: Record<string, unknown> = { updated_at: updatedAt };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.ticker !== undefined) dbUpdates.ticker = updates.ticker ?? null;
    if (updates.shares !== undefined) dbUpdates.shares = updates.shares ?? null;
    if (updates.pricePerShare !== undefined) dbUpdates.price_per_share = updates.pricePerShare ?? null;
    if (updates.institution !== undefined) dbUpdates.institution = updates.institution ?? null;
    if (updates.note !== undefined) dbUpdates.note = updates.note ?? null;

    const { error } = await createClient().from("assets").update(dbUpdates).eq("id", id);
    if (error && prev) {
      set((s) => ({ assets: s.assets.map((a) => a.id === id ? prev : a) }));
    } else {
      await get().takeSnapshot();
    }
  },

  deleteAsset: async (id) => {
    const prev = get().assets;
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
    const { error } = await createClient().from("assets").delete().eq("id", id);
    if (error) {
      set({ assets: prev });
    } else {
      await get().takeSnapshot();
    }
  },

  // ─── Liabilities ─────────────────────────────────────────────────────────────

  addLiability: async (liability) => {
    const { userId } = get();
    if (!userId) return;
    const id = crypto.randomUUID();
    const updatedAt = new Date().toISOString();
    set((s) => ({ liabilities: [{ ...liability, id, updatedAt }, ...s.liabilities] }));

    const { error } = await createClient().from("liabilities").insert({
      id,
      user_id: userId,
      name: liability.name,
      category: liability.category,
      balance: liability.balance,
      interest_rate: liability.interestRate ?? null,
      minimum_payment: liability.minimumPayment ?? null,
      institution: liability.institution ?? null,
      note: liability.note ?? null,
    });

    if (error) {
      set((s) => ({ liabilities: s.liabilities.filter((l) => l.id !== id) }));
    } else {
      await get().takeSnapshot();
    }
  },

  updateLiability: async (id, updates) => {
    const prev = get().liabilities.find((l) => l.id === id);
    const updatedAt = new Date().toISOString();
    set((s) => ({
      liabilities: s.liabilities.map((l) => l.id === id ? { ...l, ...updates, updatedAt } : l),
    }));

    const dbUpdates: Record<string, unknown> = { updated_at: updatedAt };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.interestRate !== undefined) dbUpdates.interest_rate = updates.interestRate ?? null;
    if (updates.minimumPayment !== undefined) dbUpdates.minimum_payment = updates.minimumPayment ?? null;
    if (updates.institution !== undefined) dbUpdates.institution = updates.institution ?? null;
    if (updates.note !== undefined) dbUpdates.note = updates.note ?? null;

    const { error } = await createClient().from("liabilities").update(dbUpdates).eq("id", id);
    if (error && prev) {
      set((s) => ({ liabilities: s.liabilities.map((l) => l.id === id ? prev : l) }));
    } else {
      await get().takeSnapshot();
    }
  },

  deleteLiability: async (id) => {
    const prev = get().liabilities;
    set((s) => ({ liabilities: s.liabilities.filter((l) => l.id !== id) }));
    const { error } = await createClient().from("liabilities").delete().eq("id", id);
    if (error) {
      set({ liabilities: prev });
    } else {
      await get().takeSnapshot();
    }
  },

  // ─── Snapshots ───────────────────────────────────────────────────────────────

  takeSnapshot: async () => {
    const state = get();
    if (!state.userId) return;
    const totalAssets = state.getTotalAssets();
    const totalLiabilities = state.getTotalLiabilities();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const snapshot: NetWorthSnapshot = {
      date: todayStr,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };

    set((s) => {
      const existing = s.snapshots.findIndex((snap) => snap.date === todayStr);
      if (existing >= 0) {
        const updated = [...s.snapshots];
        updated[existing] = snapshot;
        return { snapshots: updated };
      }
      return { snapshots: [...s.snapshots, snapshot].slice(-365) };
    });

    await createClient().from("net_worth_snapshots").upsert(
      {
        user_id: state.userId,
        date: todayStr,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: totalAssets - totalLiabilities,
      },
      { onConflict: "user_id,date" }
    );
  },

  // ─── Stock Prices ────────────────────────────────────────────────────────────

  refreshStockPrices: async () => {
    const { assets, userId } = get();
    const stockAssets = assets.filter((a) => a.ticker && a.shares && a.shares > 0);
    if (stockAssets.length === 0) return { updated: 0, errors: [] };

    const tickerSet: Record<string, true> = {};
    stockAssets.forEach((a) => { tickerSet[a.ticker!] = true; });
    const tickers = Object.keys(tickerSet);
    const errors: string[] = [];
    let updated = 0;

    try {
      const res = await fetch(`/api/stock-price?symbols=${tickers.join(",")}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const client = (await import("@/lib/supabase/client")).createClient();

      for (const asset of stockAssets) {
        const quote = data[asset.ticker!];
        if (!quote) { errors.push(`No data for ${asset.ticker}`); continue; }

        const newValue = quote.price * asset.shares!;
        const newPricePerShare = quote.price;

        // Update local state
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === asset.id
              ? { ...a, value: newValue, pricePerShare: newPricePerShare, updatedAt: new Date().toISOString() }
              : a
          ),
        }));

        // Sync to Supabase
        if (userId) {
          await client
            .from("assets")
            .update({ value: newValue, price_per_share: newPricePerShare, updated_at: new Date().toISOString() })
            .eq("id", asset.id);
        }
        updated++;
      }

      if (updated > 0) await get().takeSnapshot();
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Unknown error");
    }

    return { updated, errors };
  },

  // ─── Computed ────────────────────────────────────────────────────────────────

  getTotalAssets: () => get().assets.reduce((sum, a) => sum + a.value, 0),

  getTotalLiabilities: () => get().liabilities.reduce((sum, l) => sum + l.balance, 0),

  getNetWorth: () => get().getTotalAssets() - get().getTotalLiabilities(),

  getAssetsByCategory: () => {
    const result = {} as Record<AssetCategory, number>;
    for (const cat of Object.keys(ASSET_CATEGORY_META) as AssetCategory[]) {
      result[cat] = 0;
    }
    get().assets.forEach((a) => { result[a.category] = (result[a.category] || 0) + a.value; });
    return result;
  },

  getLiabilitiesByCategory: () => {
    const result = {} as Record<LiabilityCategory, number>;
    for (const cat of Object.keys(LIABILITY_CATEGORY_META) as LiabilityCategory[]) {
      result[cat] = 0;
    }
    get().liabilities.forEach((l) => { result[l.category] = (result[l.category] || 0) + l.balance; });
    return result;
  },
}));
