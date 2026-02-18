"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Loader2,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface LegacyCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface LegacyBudget {
  categoryId: string;
  amount: number;
  periodKey: string;
}

interface LegacyExpense {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  createdAt: string;
}

interface LegacyBudgetStore {
  categories: LegacyCategory[];
  budgets: LegacyBudget[];
  expenses: LegacyExpense[];
  income: number;
  periodMode?: string;
  periodStart?: string;
  periodEnd?: string;
  darkMode?: boolean;
  privacyMode?: boolean;
}

interface LegacyAsset {
  id: string;
  name: string;
  category: string;
  value: number;
  ticker?: string;
  shares?: number;
  pricePerShare?: number;
  institution?: string;
  note?: string;
  updatedAt: string;
}

interface LegacyLiability {
  id: string;
  name: string;
  category: string;
  balance: number;
  interestRate?: number;
  minimumPayment?: number;
  institution?: string;
  note?: string;
  updatedAt: string;
}

interface LegacyPortfolioStore {
  assets: LegacyAsset[];
  liabilities: LegacyLiability[];
  snapshots: Array<{
    date: string;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  }>;
}

type MigrationStatus = "idle" | "scanning" | "ready" | "migrating" | "done" | "error" | "no-data";

export default function MigratePage() {
  const router = useRouter();
  const [status, setStatus] = useState<MigrationStatus>("scanning");
  const [budgetData, setBudgetData] = useState<LegacyBudgetStore | null>(null);
  const [portfolioData, setPortfolioData] = useState<LegacyPortfolioStore | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  function addLog(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  useEffect(() => {
    async function scan() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);

      try {
        const rawBudget = localStorage.getItem("budget-store-v2");
        const rawPortfolio = localStorage.getItem("portfolio-store-v1");

        let budget: LegacyBudgetStore | null = null;
        let portfolio: LegacyPortfolioStore | null = null;

        if (rawBudget) {
          const parsed = JSON.parse(rawBudget);
          budget = parsed?.state ?? null;
        }
        if (rawPortfolio) {
          const parsed = JSON.parse(rawPortfolio);
          portfolio = parsed?.state ?? null;
        }

        if (!budget && !portfolio) {
          setStatus("no-data");
          return;
        }

        setBudgetData(budget);
        setPortfolioData(portfolio);
        setStatus("ready");
      } catch {
        setStatus("no-data");
      }
    }
    scan();
  }, [router]);

  async function runMigration() {
    if (!userId) return;
    setStatus("migrating");
    setLog([]);
    const supabase = createClient();

    try {
      // ── Budget data ────────────────────────────────────────────────────────
      if (budgetData) {
        // 1. Upsert user settings
        addLog("Restoring income and period settings…");
        await supabase.from("user_settings").upsert(
          {
            user_id: userId,
            income: budgetData.income ?? 5000,
            period_mode: budgetData.periodMode ?? "monthly",
            period_start: budgetData.periodStart ?? null,
            period_end: budgetData.periodEnd ?? null,
            dark_mode: budgetData.darkMode ?? false,
            privacy_mode: budgetData.privacyMode ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // 2. Delete existing categories (seed defaults will be replaced)
        addLog("Clearing default categories…");
        await supabase.from("categories").delete().eq("user_id", userId);

        // 3. Insert categories with stable UUIDs mapped from old IDs
        const catIdMap: Record<string, string> = {};
        if (budgetData.categories?.length) {
          addLog(`Migrating ${budgetData.categories.length} categories…`);
          const newCats = budgetData.categories.map((c) => {
            const newId = crypto.randomUUID();
            catIdMap[c.id] = newId;
            return { id: newId, user_id: userId, name: c.name, color: c.color, icon: c.icon };
          });
          const { error: catErr } = await supabase.from("categories").insert(newCats);
          if (catErr) throw new Error(`Categories: ${catErr.message}`);
          addLog(`✓ ${newCats.length} categories migrated`);
        }

        // 4. Insert budgets
        if (budgetData.budgets?.length) {
          addLog(`Migrating ${budgetData.budgets.length} budget allocations…`);
          const newBudgets = budgetData.budgets
            .filter((b) => catIdMap[b.categoryId])
            .map((b) => ({
              id: crypto.randomUUID(),
              user_id: userId,
              category_id: catIdMap[b.categoryId],
              amount: b.amount,
              period_key: b.periodKey,
            }));
          if (newBudgets.length) {
            const { error: budgetErr } = await supabase.from("budgets").insert(newBudgets);
            if (budgetErr) throw new Error(`Budgets: ${budgetErr.message}`);
          }
          addLog(`✓ ${newBudgets.length} budget allocations migrated`);
        }

        // 5. Insert expenses in batches of 100
        if (budgetData.expenses?.length) {
          addLog(`Migrating ${budgetData.expenses.length} expenses…`);
          const newExpenses = budgetData.expenses.map((e) => ({
            id: crypto.randomUUID(),
            user_id: userId,
            category_id: catIdMap[e.categoryId] ?? null,
            amount: e.amount,
            date: e.date,
            note: e.note ?? "",
            created_at: e.createdAt ?? new Date().toISOString(),
          }));

          const BATCH = 100;
          for (let i = 0; i < newExpenses.length; i += BATCH) {
            const batch = newExpenses.slice(i, i + BATCH);
            const { error: expErr } = await supabase.from("expenses").insert(batch);
            if (expErr) throw new Error(`Expenses batch ${i / BATCH + 1}: ${expErr.message}`);
          }
          addLog(`✓ ${newExpenses.length} expenses migrated`);
        }
      }

      // ── Portfolio data ─────────────────────────────────────────────────────
      if (portfolioData) {
        if (portfolioData.assets?.length) {
          addLog(`Migrating ${portfolioData.assets.length} assets…`);
          const newAssets = portfolioData.assets.map((a) => ({
            id: crypto.randomUUID(),
            user_id: userId,
            name: a.name,
            category: a.category,
            value: a.value,
            ticker: a.ticker ?? null,
            shares: a.shares ?? null,
            price_per_share: a.pricePerShare ?? null,
            institution: a.institution ?? null,
            note: a.note ?? null,
          }));
          const { error: assetErr } = await supabase.from("assets").insert(newAssets);
          if (assetErr) throw new Error(`Assets: ${assetErr.message}`);
          addLog(`✓ ${newAssets.length} assets migrated`);
        }

        if (portfolioData.liabilities?.length) {
          addLog(`Migrating ${portfolioData.liabilities.length} liabilities…`);
          const newLiabilities = portfolioData.liabilities.map((l) => ({
            id: crypto.randomUUID(),
            user_id: userId,
            name: l.name,
            category: l.category,
            balance: l.balance,
            interest_rate: l.interestRate ?? null,
            minimum_payment: l.minimumPayment ?? null,
            institution: l.institution ?? null,
            note: l.note ?? null,
          }));
          const { error: liabErr } = await supabase.from("liabilities").insert(newLiabilities);
          if (liabErr) throw new Error(`Liabilities: ${liabErr.message}`);
          addLog(`✓ ${newLiabilities.length} liabilities migrated`);
        }

        if (portfolioData.snapshots?.length) {
          addLog(`Migrating ${portfolioData.snapshots.length} net worth snapshots…`);
          const newSnapshots = portfolioData.snapshots.map((s) => ({
            id: crypto.randomUUID(),
            user_id: userId,
            date: s.date,
            total_assets: s.totalAssets,
            total_liabilities: s.totalLiabilities,
            net_worth: s.netWorth,
          }));
          await supabase
            .from("net_worth_snapshots")
            .upsert(newSnapshots, { onConflict: "user_id,date" });
          addLog(`✓ ${newSnapshots.length} snapshots migrated`);
        }
      }

      // ── Clean up localStorage ──────────────────────────────────────────────
      addLog("Clearing old localStorage data…");
      localStorage.removeItem("budget-store-v2");
      localStorage.removeItem("portfolio-store-v1");
      addLog("✓ Migration complete!");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  const totalItems =
    (budgetData?.categories?.length ?? 0) +
    (budgetData?.budgets?.length ?? 0) +
    (budgetData?.expenses?.length ?? 0) +
    (portfolioData?.assets?.length ?? 0) +
    (portfolioData?.liabilities?.length ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 mb-4">
            <Database className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Migration</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Move your local data into your Supabase account
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {/* Scanning */}
          {status === "scanning" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-slate-600 dark:text-slate-400">Scanning localStorage…</p>
            </div>
          )}

          {/* No data found */}
          {status === "no-data" && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <Package className="w-10 h-10 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">No old data found</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Your browser doesn&apos;t have any stored data to migrate.
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Ready to migrate */}
          {status === "ready" && (
            <div className="space-y-5">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Found the following data in your browser. Click <strong>Migrate</strong> to move it
                into your account permanently.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Categories", count: budgetData?.categories?.length ?? 0, color: "indigo" },
                  { label: "Budget allocations", count: budgetData?.budgets?.length ?? 0, color: "violet" },
                  { label: "Expenses", count: budgetData?.expenses?.length ?? 0, color: "amber" },
                  { label: "Assets", count: portfolioData?.assets?.length ?? 0, color: "emerald" },
                  { label: "Liabilities", count: portfolioData?.liabilities?.length ?? 0, color: "red" },
                  { label: "Net worth snapshots", count: portfolioData?.snapshots?.length ?? 0, color: "cyan" },
                ].map(({ label, count, color }) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between bg-${color}-50 dark:bg-${color}-500/10 border border-${color}-100 dark:border-${color}-500/20 rounded-xl px-4 py-3`}
                  >
                    <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
                    <span className={`text-sm font-bold text-${color}-600 dark:text-${color}-400`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>

              {budgetData && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  Monthly income: <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(budgetData.income)}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  onClick={runMigration}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                >
                  Migrate {totalItems} items to Supabase
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Migrating */}
          {status === "migrating" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
                <p className="font-medium text-slate-900 dark:text-white">Migration in progress…</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 font-mono text-xs text-slate-600 dark:text-slate-300 space-y-1 max-h-48 overflow-y-auto">
                {log.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {status === "done" && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 font-mono text-xs text-slate-600 dark:text-slate-300 space-y-1 max-h-48 overflow-y-auto">
                {log.map((line, i) => (
                  <div key={i} className={line.startsWith("✓") ? "text-emerald-600 dark:text-emerald-400" : ""}>
                    {line}
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300">All done!</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Your data is now in Supabase and available from any device.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-300">Migration failed</p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1 font-mono">{error}</p>
                </div>
              </div>
              {log.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 font-mono text-xs text-slate-600 dark:text-slate-300 space-y-1 max-h-32 overflow-y-auto">
                  {log.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setStatus("ready")}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
