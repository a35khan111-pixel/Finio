"use client";

import { useEffect } from "react";
import { useBudgetStore } from "@/store/useBudgetStore";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useFriendsStore } from "@/store/useFriendsStore";
import { createClient } from "@/lib/supabase/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const darkMode = useBudgetStore((s) => s.darkMode);

  useEffect(() => {
    const supabase = createClient();

    async function initForUser(userId: string, email: string) {
      // Ensure the user has a public profile (auto-create on first sign-in)
      await useFriendsStore.getState().ensureProfile(userId, email);
      // Load all app data in parallel
      await Promise.all([
        useBudgetStore.getState().loadAllData(),
        usePortfolioStore.getState().loadAllData(userId),
        useFriendsStore.getState().loadAll(),
      ]);
    }

    // Load data for the current session on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) initForUser(user.id, user.email ?? "");
    });

    // Keep stores in sync with auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          initForUser(session.user.id, session.user.email ?? "");
        } else if (event === "SIGNED_OUT") {
          useBudgetStore.getState().clearData();
          usePortfolioStore.getState().clearData();
          useFriendsStore.getState().clearAll();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return <>{children}</>;
}
