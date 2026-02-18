"use client";

import { create } from "zustand";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  differenceInCalendarDays,
  addDays,
  parseISO,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";

export type PeriodMode = "monthly" | "custom";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Budget {
  categoryId: string;
  amount: number;
  periodKey: string;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  date: string; // "YYYY-MM-DD"
  note: string;
  createdAt: string;
}

export interface BudgetStore {
  categories: Category[];
  budgets: Budget[];
  expenses: Expense[];
  income: number;
  savingsGoal: number;
  periodMode: PeriodMode;
  periodStart: string;
  periodEnd: string;
  darkMode: boolean;
  privacyMode: boolean;
  userId: string | null;
  isLoading: boolean;

  // Lifecycle
  loadAllData: () => Promise<void>;
  clearData: () => void;

  // Category actions
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Budget actions
  setBudget: (categoryId: string, amount: number, periodKey?: string) => Promise<void>;
  deleteBudget: (categoryId: string, periodKey?: string) => Promise<void>;

  // Expense actions
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Settings
  setIncome: (amount: number) => void;
  setSavingsGoal: (amount: number) => void;
  setPeriodMode: (mode: PeriodMode) => void;
  setMonthlyPeriod: (yearMonth: string) => void;
  setCustomPeriod: (start: string, end: string) => void;
  navigatePeriod: (direction: "prev" | "next") => void;
  archiveCurrentPeriod: () => void;
  toggleDarkMode: () => void;
  togglePrivacyMode: () => void;

  // Computed
  getCurrentPeriodKey: () => string;
  getPeriodLabel: () => string;
  getPeriodExpenses: (start?: string, end?: string) => Expense[];
  getPeriodBudgets: (periodKey?: string) => Budget[];
  getCategoryBudget: (categoryId: string, periodKey?: string) => number;
  getCategorySpent: (categoryId: string, start?: string, end?: string) => number;
  getTotalBudgeted: (periodKey?: string) => number;
  getTotalSpent: (start?: string, end?: string) => number;
  getBudgetHealthScore: () => number;
}

// Savings is now a first-allocation from income, not an expense category
const DEFAULT_CATEGORIES_SEED = [
  { name: "Housing", color: "#6366f1", icon: "home" },
  { name: "Food & Dining", color: "#f59e0b", icon: "utensils" },
  { name: "Transport", color: "#10b981", icon: "car" },
  { name: "Entertainment", color: "#ec4899", icon: "film" },
  { name: "Health", color: "#ef4444", icon: "heart" },
  { name: "Shopping", color: "#8b5cf6", icon: "shopping-bag" },
  { name: "Utilities", color: "#06b6d4", icon: "zap" },
  { name: "Personal Care", color: "#f97316", icon: "sparkles" },
];

const today = new Date();
const defaultStart = format(startOfMonth(today), "yyyy-MM-dd");
const defaultEnd = format(endOfMonth(today), "yyyy-MM-dd");

function getPeriodKeyFromDates(mode: PeriodMode, start: string, end: string): string {
  if (mode === "monthly") return start.slice(0, 7);
  return `${start}:${end}`;
}

async function syncSettings(
  userId: string,
  updates: Record<string, unknown>
) {
  const client = createClient();
  await client
    .from("user_settings")
    .upsert({ user_id: userId, updated_at: new Date().toISOString(), ...updates }, { onConflict: "user_id" });
}

export const useBudgetStore = create<BudgetStore>()((set, get) => ({
  categories: [],
  budgets: [],
  expenses: [],
  income: 5000,
  savingsGoal: 0,
  periodMode: "monthly",
  periodStart: defaultStart,
  periodEnd: defaultEnd,
  darkMode: false,
  privacyMode: false,
  userId: null,
  isLoading: false,

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  loadAllData: async () => {
    set({ isLoading: true });
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) { set({ isLoading: false }); return; }

    const [catsRes, budgetsRes, expensesRes, settingsRes] = await Promise.all([
      client.from("categories").select("*").eq("user_id", user.id).order("created_at"),
      client.from("budgets").select("*").eq("user_id", user.id),
      client.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      client.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    let categories: Category[] = (catsRes.data ?? []).map((c: Record<string, string>) => ({
      id: c.id, name: c.name, color: c.color, icon: c.icon,
    }));

    // Seed default categories for new users
    if (categories.length === 0) {
      const { data: seeded } = await client
        .from("categories")
        .insert(DEFAULT_CATEGORIES_SEED.map((c) => ({ ...c, user_id: user.id })))
        .select();
      categories = (seeded ?? []).map((c: Record<string, string>) => ({
        id: c.id, name: c.name, color: c.color, icon: c.icon,
      }));
    }

    const budgets: Budget[] = (budgetsRes.data ?? []).map((b: Record<string, unknown>) => ({
      categoryId: b.category_id as string,
      amount: parseFloat(String(b.amount)),
      periodKey: b.period_key as string,
    }));

    const expenses: Expense[] = (expensesRes.data ?? []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      amount: parseFloat(String(e.amount)),
      categoryId: (e.category_id as string) ?? "",
      date: e.date as string,
      note: (e.note as string) ?? "",
      createdAt: e.created_at as string,
    }));

    const s = settingsRes.data;

    // Seed default settings for new users
    if (!s) {
      await client.from("user_settings").insert({
        user_id: user.id,
        income: 5000,
        period_mode: "monthly",
        period_start: defaultStart,
        period_end: defaultEnd,
        dark_mode: false,
        privacy_mode: false,
      });
    }

    set({
      userId: user.id,
      categories,
      budgets,
      expenses,
      income: s ? parseFloat(String(s.income)) : 5000,
      savingsGoal: s?.savings_goal ? parseFloat(String(s.savings_goal)) : 0,
      periodMode: (s?.period_mode ?? "monthly") as PeriodMode,
      periodStart: s?.period_start ?? defaultStart,
      periodEnd: s?.period_end ?? defaultEnd,
      darkMode: s?.dark_mode ?? false,
      privacyMode: s?.privacy_mode ?? false,
      isLoading: false,
    });
  },

  clearData: () =>
    set({
      categories: [],
      budgets: [],
      expenses: [],
      income: 5000,
      savingsGoal: 0,
      periodMode: "monthly",
      periodStart: defaultStart,
      periodEnd: defaultEnd,
      darkMode: false,
      privacyMode: false,
      userId: null,
      isLoading: false,
    }),

  // ─── Categories ──────────────────────────────────────────────────────────────

  addCategory: async (category) => {
    const { userId } = get();
    if (!userId) return;
    const id = crypto.randomUUID();
    set((s) => ({ categories: [...s.categories, { ...category, id }] }));
    const { error } = await createClient()
      .from("categories")
      .insert({ id, user_id: userId, ...category });
    if (error) set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  updateCategory: async (id, updates) => {
    const prev = get().categories.find((c) => c.id === id);
    set((s) => ({ categories: s.categories.map((c) => c.id === id ? { ...c, ...updates } : c) }));
    const { error } = await createClient().from("categories").update(updates).eq("id", id);
    if (error && prev) set((s) => ({ categories: s.categories.map((c) => c.id === id ? prev : c) }));
  },

  deleteCategory: async (id) => {
    const prev = get().categories;
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      budgets: s.budgets.filter((b) => b.categoryId !== id),
      expenses: s.expenses.filter((e) => e.categoryId !== id),
    }));
    const { error } = await createClient().from("categories").delete().eq("id", id);
    if (error) set({ categories: prev });
  },

  // ─── Budgets ─────────────────────────────────────────────────────────────────

  setBudget: async (categoryId, amount, periodKey) => {
    const key = periodKey ?? get().getCurrentPeriodKey();
    const { userId } = get();
    if (!userId) return;

    set((s) => {
      const exists = s.budgets.find((b) => b.categoryId === categoryId && b.periodKey === key);
      if (exists) {
        return { budgets: s.budgets.map((b) => b.categoryId === categoryId && b.periodKey === key ? { ...b, amount } : b) };
      }
      return { budgets: [...s.budgets, { categoryId, amount, periodKey: key }] };
    });

    await createClient()
      .from("budgets")
      .upsert(
        { user_id: userId, category_id: categoryId, amount, period_key: key },
        { onConflict: "category_id,period_key" }
      );
  },

  deleteBudget: async (categoryId, periodKey) => {
    const key = periodKey ?? get().getCurrentPeriodKey();
    set((s) => ({ budgets: s.budgets.filter((b) => !(b.categoryId === categoryId && b.periodKey === key)) }));
    await createClient().from("budgets").delete().eq("category_id", categoryId).eq("period_key", key);
  },

  // ─── Expenses ────────────────────────────────────────────────────────────────

  addExpense: async (expense) => {
    const { userId } = get();
    if (!userId) return;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    set((s) => ({ expenses: [{ ...expense, id, createdAt }, ...s.expenses] }));
    const { error } = await createClient().from("expenses").insert({
      id,
      user_id: userId,
      category_id: expense.categoryId || null,
      amount: expense.amount,
      date: expense.date,
      note: expense.note,
    });
    if (error) set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },

  updateExpense: async (id, updates) => {
    const prev = get().expenses.find((e) => e.id === id);
    set((s) => ({ expenses: s.expenses.map((e) => e.id === id ? { ...e, ...updates } : e) }));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId || null;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.note !== undefined) dbUpdates.note = updates.note;
    const { error } = await createClient().from("expenses").update(dbUpdates).eq("id", id);
    if (error && prev) set((s) => ({ expenses: s.expenses.map((e) => e.id === id ? prev : e) }));
  },

  deleteExpense: async (id) => {
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
    await createClient().from("expenses").delete().eq("id", id);
  },

  // ─── Settings ────────────────────────────────────────────────────────────────

  setIncome: (amount) => {
    set({ income: amount });
    const { userId } = get();
    if (userId) syncSettings(userId, { income: amount });
  },

  setSavingsGoal: (amount) => {
    set({ savingsGoal: amount });
    const { userId } = get();
    if (userId) syncSettings(userId, { savings_goal: amount });
  },

  toggleDarkMode: () => {
    const darkMode = !get().darkMode;
    set({ darkMode });
    const { userId } = get();
    if (userId) syncSettings(userId, { dark_mode: darkMode });
  },

  togglePrivacyMode: () => {
    const privacyMode = !get().privacyMode;
    set({ privacyMode });
    const { userId } = get();
    if (userId) syncSettings(userId, { privacy_mode: privacyMode });
  },

  setPeriodMode: (mode) => {
    if (mode === "monthly") {
      const start = format(startOfMonth(today), "yyyy-MM-dd");
      const end = format(endOfMonth(today), "yyyy-MM-dd");
      set({ periodMode: "monthly", periodStart: start, periodEnd: end });
      const { userId } = get();
      if (userId) syncSettings(userId, { period_mode: "monthly", period_start: start, period_end: end });
    } else {
      set({ periodMode: mode });
      const { userId } = get();
      if (userId) syncSettings(userId, { period_mode: mode });
    }
  },

  setMonthlyPeriod: (yearMonth) => {
    const [year, month] = yearMonth.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    const start = format(startOfMonth(date), "yyyy-MM-dd");
    const end = format(endOfMonth(date), "yyyy-MM-dd");
    set({ periodMode: "monthly", periodStart: start, periodEnd: end });
    const { userId } = get();
    if (userId) syncSettings(userId, { period_mode: "monthly", period_start: start, period_end: end });
  },

  setCustomPeriod: (start, end) => {
    set({ periodMode: "custom", periodStart: start, periodEnd: end });
    const { userId } = get();
    if (userId) syncSettings(userId, { period_mode: "custom", period_start: start, period_end: end });
  },

  navigatePeriod: (direction) => {
    const { periodMode, periodStart, periodEnd, userId } = get();
    const mul = direction === "next" ? 1 : -1;
    let start: string, end: string;

    if (periodMode === "monthly") {
      const date = parseISO(periodStart);
      const newDate = direction === "next" ? addMonths(date, 1) : subMonths(date, 1);
      start = format(startOfMonth(newDate), "yyyy-MM-dd");
      end = format(endOfMonth(newDate), "yyyy-MM-dd");
    } else {
      const s = parseISO(periodStart);
      const e = parseISO(periodEnd);
      const days = differenceInCalendarDays(e, s) + 1;
      start = format(addDays(s, mul * days), "yyyy-MM-dd");
      end = format(addDays(e, mul * days), "yyyy-MM-dd");
    }

    set({ periodStart: start, periodEnd: end });
    if (userId) syncSettings(userId, { period_start: start, period_end: end });
  },

  archiveCurrentPeriod: () => {
    get().navigatePeriod("next");
  },

  // ─── Computed ────────────────────────────────────────────────────────────────

  getCurrentPeriodKey: () => {
    const { periodMode, periodStart, periodEnd } = get();
    return getPeriodKeyFromDates(periodMode, periodStart, periodEnd);
  },

  getPeriodLabel: () => {
    const { periodMode, periodStart, periodEnd } = get();
    if (periodMode === "monthly") {
      return format(parseISO(periodStart), "MMMM yyyy");
    }
    const start = parseISO(periodStart);
    const end = parseISO(periodEnd);
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    if (sameMonth) return `${format(start, "MMM d")}–${format(end, "d, yyyy")}`;
    if (sameYear) return `${format(start, "MMM d")}–${format(end, "MMM d, yyyy")}`;
    return `${format(start, "MMM d, yyyy")}–${format(end, "MMM d, yyyy")}`;
  },

  getPeriodExpenses: (start, end) => {
    const s = start ?? get().periodStart;
    const e = end ?? get().periodEnd;
    return get().expenses.filter((exp) => exp.date >= s && exp.date <= e);
  },

  getPeriodBudgets: (periodKey) => {
    const key = periodKey ?? get().getCurrentPeriodKey();
    return get().budgets.filter((b) => b.periodKey === key);
  },

  getCategoryBudget: (categoryId, periodKey) => {
    const key = periodKey ?? get().getCurrentPeriodKey();
    return get().budgets.find((b) => b.categoryId === categoryId && b.periodKey === key)?.amount ?? 0;
  },

  getCategorySpent: (categoryId, start, end) => {
    const s = start ?? get().periodStart;
    const e = end ?? get().periodEnd;
    return get().expenses
      .filter((exp) => exp.categoryId === categoryId && exp.date >= s && exp.date <= e)
      .reduce((sum, exp) => sum + exp.amount, 0);
  },

  getTotalBudgeted: (periodKey) => {
    const key = periodKey ?? get().getCurrentPeriodKey();
    return get().budgets.filter((b) => b.periodKey === key).reduce((sum, b) => sum + b.amount, 0);
  },

  getTotalSpent: (start, end) => {
    const s = start ?? get().periodStart;
    const e = end ?? get().periodEnd;
    return get().expenses.filter((exp) => exp.date >= s && exp.date <= e).reduce((sum, exp) => sum + exp.amount, 0);
  },

  getBudgetHealthScore: () => {
    const state = get();
    const totalBudgeted = state.getTotalBudgeted();
    const totalSpent = state.getTotalSpent();
    if (totalBudgeted === 0) return 100;
    const spendingScore = Math.max(0, 100 - (totalSpent / totalBudgeted) * 80);
    const categoryScores = state.categories
      .map((cat) => {
        const budget = state.getCategoryBudget(cat.id);
        const spent = state.getCategorySpent(cat.id);
        if (budget === 0) return 100;
        return Math.max(0, 100 - (spent / budget) * 100);
      })
      .filter((s) => s < 100);
    const avgCategoryScore =
      categoryScores.length > 0
        ? categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length
        : 100;
    const savingsRate =
      state.income > 0 ? Math.min(20, ((state.income - totalSpent) / state.income) * 20) : 0;
    return Math.round(spendingScore * 0.5 + avgCategoryScore * 0.3 + savingsRate * 1);
  },
}));
