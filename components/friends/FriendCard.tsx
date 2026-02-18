"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  UserMinus,
  Receipt,
  BarChart2,
  TrendingUp,
  DollarSign,
  Lock,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { ProgressBar } from "@/components/ProgressBar";
import type { Friend } from "@/store/useFriendsStore";
import type { PrivacySettings } from "@/store/useFriendsStore";

interface FriendData {
  privacy: PrivacySettings | null;
  income: number | null;
  categories: Array<{ id: string; name: string; color: string }>;
  budgets: Array<{ categoryId: string; amount: number; periodKey: string }>;
  expenses: Array<{ id: string; amount: number; categoryId: string; date: string; note: string }>;
  assets: Array<{ id: string; name: string; value: number; category: string }>;
  liabilities: Array<{ id: string; name: string; balance: number }>;
}

interface FriendCardProps {
  friend: Friend;
  onRemove: (requestId: string) => void;
}

export function FriendCard({ friend, onRemove }: FriendCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<FriendData | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const { profile } = friend;
  const initials = (profile.displayName || profile.username).slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!expanded || data) return;
    loadFriendData(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFriendData() {
    setLoading(true);
    const client = createClient();
    const uid = profile.id;

    const [privRes, settingsRes, catsRes, budgetsRes, expensesRes, assetsRes, liabsRes] =
      await Promise.all([
        client.from("privacy_settings").select("*").eq("user_id", uid).maybeSingle(),
        client.from("user_settings").select("income, period_start, period_end").eq("user_id", uid).maybeSingle(),
        client.from("categories").select("id,name,color").eq("user_id", uid),
        client.from("budgets").select("category_id,amount,period_key").eq("user_id", uid),
        client
          .from("expenses")
          .select("id,amount,category_id,date,note")
          .eq("user_id", uid)
          .order("date", { ascending: false })
          .limit(8),
        client.from("assets").select("id,name,value,category").eq("user_id", uid),
        client.from("liabilities").select("id,name,balance").eq("user_id", uid),
      ]);

    const privRow = privRes.data;
    setData({
      privacy: privRow
        ? {
            showIncome: Boolean(privRow.show_income),
            showBudgets: privRow.show_budgets !== false,
            showExpenses: privRow.show_expenses !== false,
            showCategories: privRow.show_categories !== false,
            showPortfolio: Boolean(privRow.show_portfolio),
          }
        : null,
      income: settingsRes.data ? parseFloat(settingsRes.data.income) : null,
      categories: (catsRes.data ?? []).map((c: Record<string, string>) => ({ id: c.id, name: c.name, color: c.color })),
      budgets: (budgetsRes.data ?? []).map((b: Record<string, unknown>) => ({
        categoryId: b.category_id as string,
        amount: parseFloat(String(b.amount)),
        periodKey: b.period_key as string,
      })),
      expenses: (expensesRes.data ?? []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        amount: parseFloat(String(e.amount)),
        categoryId: (e.category_id as string) ?? "",
        date: e.date as string,
        note: (e.note as string) ?? "",
      })),
      assets: (assetsRes.data ?? []).map((a: Record<string, unknown>) => ({
        id: a.id as string, name: a.name as string, value: parseFloat(String(a.value)), category: a.category as string,
      })),
      liabilities: (liabsRes.data ?? []).map((l: Record<string, unknown>) => ({
        id: l.id as string, name: l.name as string, balance: parseFloat(String(l.balance)),
      })),
    });
    setLoading(false);
  }

  // Compute quick stats for the card header
  const totalSpent = data?.expenses.reduce((s, e) => s + e.amount, 0) ?? 0;
  const netWorth = data
    ? data.assets.reduce((s, a) => s + a.value, 0) - data.liabilities.reduce((s, l) => s + l.balance, 0)
    : 0;

  // Current period budgets (latest period_key)
  const periodKeys = data?.budgets.map((b) => b.periodKey) ?? [];
  const uniqueKeys: string[] = periodKeys.filter((k, i) => periodKeys.indexOf(k) === i);
  const latestPeriodKey = uniqueKeys.length ? uniqueKeys.sort().reverse()[0] : null;
  const periodBudgets = data?.budgets.filter((b) => b.periodKey === latestPeriodKey) ?? [];
  const totalBudgeted = periodBudgets.reduce((s, b) => s + b.amount, 0);

  const categoryMap = Object.fromEntries((data?.categories ?? []).map((c) => [c.id, c]));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: profile.avatarColor }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">
            {profile.displayName || profile.username}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">@{profile.username}</p>
        </div>

        {/* Quick stats when not expanded */}
        {!expanded && data && (
          <div className="hidden sm:flex items-center gap-4 text-right">
            {data.privacy?.showBudgets && totalBudgeted > 0 && (
              <div>
                <p className="text-xs text-slate-400">Budgeted</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(totalBudgeted)}</p>
              </div>
            )}
            {data.privacy?.showExpenses && data.expenses.length > 0 && (
              <div>
                <p className="text-xs text-slate-400">Spent</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(totalSpent)}</p>
              </div>
            )}
            {data.privacy?.showPortfolio && (
              <div>
                <p className="text-xs text-slate-400">Net Worth</p>
                <p className={`text-sm font-semibold ${netWorth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  {formatCurrency(Math.abs(netWorth))}
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading {profile.username}&apos;s data…</span>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Income */}
              {data.privacy?.showIncome && data.income !== null && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl px-4 py-3">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Monthly income</span>
                  <span className="ml-auto text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(data.income)}
                  </span>
                </div>
              )}

              {/* Budgets */}
              {data.privacy?.showBudgets && periodBudgets.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Budget Allocations
                    </span>
                  </div>
                  <div className="space-y-2">
                    {periodBudgets.slice(0, 6).map((b) => {
                      const cat = categoryMap[b.categoryId];
                      const spent = data.expenses.filter((e) => e.categoryId === b.categoryId).reduce((s, e) => s + e.amount, 0);
                      const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
                      return (
                        <div key={b.categoryId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {cat && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                              <span className="text-slate-600 dark:text-slate-400">{cat?.name ?? "Unknown"}</span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-500">
                              {formatCurrency(spent)} / {formatCurrency(b.amount)}
                            </span>
                          </div>
                          <ProgressBar value={pct} color={cat?.color ?? "#6366f1"} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : data.privacy?.showBudgets === false ? (
                <LockedSection icon={BarChart2} label="Budget Allocations" />
              ) : null}

              {/* Recent expenses */}
              {data.privacy?.showExpenses && data.expenses.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Recent Expenses
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {data.expenses.slice(0, 5).map((e) => {
                      const cat = categoryMap[e.categoryId];
                      return (
                        <div key={e.id} className="flex items-center gap-3 py-1.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: (cat?.color ?? "#6366f1") + "20" }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color ?? "#6366f1" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                              {e.note || cat?.name || "Expense"}
                            </p>
                            <p className="text-xs text-slate-400">{e.date}</p>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white shrink-0">
                            {formatCurrency(e.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : data.privacy?.showExpenses === false ? (
                <LockedSection icon={Receipt} label="Expenses" />
              ) : null}

              {/* Portfolio */}
              {data.privacy?.showPortfolio && (data.assets.length > 0 || data.liabilities.length > 0) ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Portfolio
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 mb-1">Assets</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(data.assets.reduce((s, a) => s + a.value, 0))}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 mb-1">Liabilities</p>
                      <p className="text-sm font-bold text-red-500">
                        {formatCurrency(data.liabilities.reduce((s, l) => s + l.balance, 0))}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 mb-1">Net Worth</p>
                      <p className={`text-sm font-bold ${netWorth >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500"}`}>
                        {formatCurrency(Math.abs(netWorth))}
                      </p>
                    </div>
                  </div>
                </div>
              ) : data.privacy?.showPortfolio === false ? (
                <LockedSection icon={TrendingUp} label="Portfolio" />
              ) : null}

              {/* Nothing shared */}
              {!data.privacy?.showBudgets &&
                !data.privacy?.showExpenses &&
                !data.privacy?.showIncome &&
                !data.privacy?.showPortfolio && (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    {profile.username} hasn&apos;t shared any data yet.
                  </div>
                )}
            </>
          )}

          {/* Remove friend */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            {confirmRemove ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">Remove {profile.username}?</p>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onRemove(friend.requestId)}
                  className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRemove(true)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <UserMinus className="w-3.5 h-3.5" />
                Remove friend
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LockedSection({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-400">
      <Lock className="w-4 h-4" />
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label} is hidden</span>
    </div>
  );
}
