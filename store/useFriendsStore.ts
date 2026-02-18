"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  avatarColor: string;
  createdAt: string;
}

export interface PrivacySettings {
  showIncome: boolean;
  showBudgets: boolean;
  showExpenses: boolean;
  showCategories: boolean;
  showPortfolio: boolean;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  profile: Profile; // the other person's profile
}

export interface Friend {
  requestId: string;
  profile: Profile;
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  showIncome: false,
  showBudgets: true,
  showExpenses: true,
  showCategories: true,
  showPortfolio: false,
};

export interface FriendsStore {
  myProfile: Profile | null;
  myPrivacy: PrivacySettings;
  friends: Friend[];
  pendingReceived: FriendRequest[];
  pendingSent: FriendRequest[];
  isLoading: boolean;

  // Lifecycle
  loadAll: () => Promise<void>;
  clearAll: () => void;

  // Profile
  ensureProfile: (userId: string, email: string) => Promise<void>;
  updateProfile: (updates: { username?: string; displayName?: string; avatarColor?: string }) => Promise<string | null>;

  // Privacy
  updatePrivacy: (settings: Partial<PrivacySettings>) => Promise<void>;

  // Friendship
  sendRequest: (toUserId: string) => Promise<string | null>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (requestId: string) => Promise<void>;

  // Discovery
  searchUsers: (query: string) => Promise<Profile[]>;
  getAllUsers: () => Promise<Profile[]>;
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: (row.display_name as string) || null,
    avatarColor: (row.avatar_color as string) || "#6366f1",
    createdAt: row.created_at as string,
  };
}

function mapPrivacy(row: Record<string, unknown> | null): PrivacySettings {
  if (!row) return DEFAULT_PRIVACY;
  return {
    showIncome: Boolean(row.show_income),
    showBudgets: row.show_budgets !== false,
    showExpenses: row.show_expenses !== false,
    showCategories: row.show_categories !== false,
    showPortfolio: Boolean(row.show_portfolio),
  };
}

export const useFriendsStore = create<FriendsStore>()((set, get) => ({
  myProfile: null,
  myPrivacy: DEFAULT_PRIVACY,
  friends: [],
  pendingReceived: [],
  pendingSent: [],
  isLoading: false,

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  loadAll: async () => {
    set({ isLoading: true });
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) { set({ isLoading: false }); return; }

    const [profileRes, privacyRes, requestsRes] = await Promise.all([
      client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      client.from("privacy_settings").select("*").eq("user_id", user.id).maybeSingle(),
      client.from("friend_requests").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
    ]);

    const requests = requestsRes.data ?? [];

    // Collect all "other" user IDs from requests (deduplicated)
    const otherIdsSet: Record<string, true> = {};
    requests.forEach((r: Record<string, string>) => {
      const other = r.sender_id === user.id ? r.receiver_id : r.sender_id;
      otherIdsSet[other] = true;
    });
    const otherIds = Object.keys(otherIdsSet);

    let profileMap: Record<string, Profile> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await client
        .from("profiles")
        .select("*")
        .in("id", otherIds);
      (profiles ?? []).forEach((p: Record<string, unknown>) => {
        profileMap[p.id as string] = mapProfile(p);
      });
    }

    const friends: Friend[] = [];
    const pendingReceived: FriendRequest[] = [];
    const pendingSent: FriendRequest[] = [];

    for (const r of requests as Array<Record<string, string>>) {
      const otherId = r.sender_id === user.id ? r.receiver_id : r.sender_id;
      const profile = profileMap[otherId] ?? {
        id: otherId, username: "unknown", displayName: null, avatarColor: "#6366f1", createdAt: "",
      };

      if (r.status === "accepted") {
        friends.push({ requestId: r.id, profile });
      } else if (r.status === "pending") {
        const req: FriendRequest = {
          id: r.id, senderId: r.sender_id, receiverId: r.receiver_id,
          status: "pending", createdAt: r.created_at, profile,
        };
        if (r.receiver_id === user.id) pendingReceived.push(req);
        else pendingSent.push(req);
      }
    }

    set({
      myProfile: profileRes.data ? mapProfile(profileRes.data) : null,
      myPrivacy: mapPrivacy(privacyRes.data),
      friends,
      pendingReceived,
      pendingSent,
      isLoading: false,
    });
  },

  clearAll: () => set({ myProfile: null, myPrivacy: DEFAULT_PRIVACY, friends: [], pendingReceived: [], pendingSent: [], isLoading: false }),

  // ─── Profile ─────────────────────────────────────────────────────────────────

  ensureProfile: async (userId, email) => {
    const client = createClient();
    const { data: existing } = await client.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (existing) return;

    const base = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 20) || "user";
    let username = base;

    const { error } = await client.from("profiles").insert({
      id: userId, username, display_name: base, avatar_color: "#6366f1",
    });

    if (error?.code === "23505") {
      // username taken — add random suffix
      username = `${base}${Math.floor(Math.random() * 9000) + 1000}`;
      await client.from("profiles").insert({
        id: userId, username, display_name: base, avatar_color: "#6366f1",
      });
    }

    await get().loadAll();
  },

  updateProfile: async (updates) => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return "Not authenticated";

    const dbUpdates: Record<string, string> = {};
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.avatarColor !== undefined) dbUpdates.avatar_color = updates.avatarColor;

    const { error } = await client.from("profiles").update(dbUpdates).eq("id", user.id);
    if (error) return error.code === "23505" ? "That username is already taken." : error.message;

    set((s) => ({
      myProfile: s.myProfile
        ? { ...s.myProfile, ...updates }
        : null,
    }));
    return null;
  },

  // ─── Privacy ─────────────────────────────────────────────────────────────────

  updatePrivacy: async (settings) => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const current = get().myPrivacy;
    const merged = { ...current, ...settings };
    set({ myPrivacy: merged });

    await client.from("privacy_settings").upsert(
      {
        user_id: user.id,
        show_income: merged.showIncome,
        show_budgets: merged.showBudgets,
        show_expenses: merged.showExpenses,
        show_categories: merged.showCategories,
        show_portfolio: merged.showPortfolio,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  },

  // ─── Friendship ──────────────────────────────────────────────────────────────

  sendRequest: async (toUserId) => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return "Not authenticated";

    const { error } = await client.from("friend_requests").insert({
      sender_id: user.id,
      receiver_id: toUserId,
      status: "pending",
    });

    if (error) return error.message;
    await get().loadAll();
    return null;
  },

  acceptRequest: async (requestId) => {
    const client = createClient();
    await client.from("friend_requests").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", requestId);
    await get().loadAll();
  },

  declineRequest: async (requestId) => {
    const client = createClient();
    await client.from("friend_requests").update({ status: "declined", updated_at: new Date().toISOString() }).eq("id", requestId);
    await get().loadAll();
  },

  cancelRequest: async (requestId) => {
    const client = createClient();
    await client.from("friend_requests").delete().eq("id", requestId);
    await get().loadAll();
  },

  removeFriend: async (requestId) => {
    const client = createClient();
    await client.from("friend_requests").delete().eq("id", requestId);
    await get().loadAll();
  },

  // ─── Discovery ───────────────────────────────────────────────────────────────

  searchUsers: async (query) => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return [];

    const { data } = await client
      .from("profiles")
      .select("*")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq("id", user.id)
      .limit(20);

    return (data ?? []).map(mapProfile);
  },

  getAllUsers: async () => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return [];

    const { data } = await client
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    return (data ?? []).map(mapProfile);
  },
}));
