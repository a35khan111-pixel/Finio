"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Bell,
  Search,
  Check,
  X,
  Shield,
  Clock,
  UserCheck,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { useFriendsStore, type Profile } from "@/store/useFriendsStore";
import { FriendCard } from "@/components/friends/FriendCard";
import { PrivacySettingsModal } from "@/components/friends/PrivacySettingsModal";

type Tab = "friends" | "requests" | "discover";

export default function FriendsPage() {
  const {
    myProfile,
    friends,
    pendingReceived,
    pendingSent,
    isLoading,
    loadAll,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
    sendRequest,
    searchUsers,
    getAllUsers,
  } = useFriendsStore();

  const [tab, setTab] = useState<Tab>("friends");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [sentToIds, setSentToIds] = useState<Set<string>>(new Set());
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAll(); // eslint-disable-line react-hooks/exhaustive-deps
  }, []);

  // Load all users when discover tab is opened
  useEffect(() => {
    if (tab === "discover" && allUsers.length === 0) {
      loadDiscoverUsers(); // eslint-disable-line react-hooks/exhaustive-deps
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDiscoverUsers() {
    setLoadingUsers(true);
    const users = await getAllUsers();
    setAllUsers(users);
    setLoadingUsers(false);
  }

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const results = await searchUsers(q.trim());
    setSearchResults(results);
    setSearching(false);
  }, [searchUsers]);

  async function handleSendRequest(userId: string) {
    setPendingActions((p) => new Set(p).add(userId));
    setRequestErrors((e) => { const n = { ...e }; delete n[userId]; return n; });
    const err = await sendRequest(userId);
    setPendingActions((p) => { const n = new Set(p); n.delete(userId); return n; });
    if (err) {
      setRequestErrors((e) => ({ ...e, [userId]: err }));
    } else {
      setSentToIds((s) => new Set(s).add(userId));
    }
  }

  async function handleAccept(requestId: string) {
    setPendingActions((p) => new Set(p).add(requestId));
    await acceptRequest(requestId);
    setPendingActions((p) => { const n = new Set(p); n.delete(requestId); return n; });
  }

  async function handleDecline(requestId: string) {
    setPendingActions((p) => new Set(p).add(requestId));
    await declineRequest(requestId);
    setPendingActions((p) => { const n = new Set(p); n.delete(requestId); return n; });
  }

  async function handleCancel(requestId: string) {
    setPendingActions((p) => new Set(p).add(requestId));
    await cancelRequest(requestId);
    setPendingActions((p) => { const n = new Set(p); n.delete(requestId); return n; });
  }

  // Compute which users are already friends/pending for the discover tab
  const friendIds = new Set(friends.map((f) => f.profile.id));
  const pendingSentIds = new Set(pendingSent.map((r) => r.profile.id));
  const pendingReceivedIds = new Set(pendingReceived.map((r) => r.profile.id));

  function getUserStatus(userId: string): "friend" | "sent" | "received" | "none" {
    if (friendIds.has(userId)) return "friend";
    if (pendingSentIds.has(userId) || sentToIds.has(userId)) return "sent";
    if (pendingReceivedIds.has(userId)) return "received";
    return "none";
  }

  const displayUsers = searchQuery.trim().length >= 2 ? searchResults : allUsers;
  const requestBadge = pendingReceived.length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "friends", label: "Friends", icon: Users },
    { id: "requests", label: "Requests", icon: Bell, badge: requestBadge },
    { id: "discover", label: "Find People", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Friends</h1>
            {myProfile && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                You&apos;re{" "}
                <span
                  className="font-semibold px-2 py-0.5 rounded-full text-white text-xs"
                  style={{ backgroundColor: myProfile.avatarColor }}
                >
                  @{myProfile.username}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={() => setShowPrivacy(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/50 text-sm font-medium transition-all shadow-sm"
          >
            <Shield className="w-4 h-4" />
            Privacy Settings
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 mb-6 shadow-sm">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              {badge ? (
                <span className={`w-5 h-5 text-xs rounded-full flex items-center justify-center font-bold ${tab === id ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}>
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {/* ── Friends Tab ──────────────────────────────────────────────────────── */}
        {!isLoading && tab === "friends" && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No friends yet"
                desc='Go to "Find People" to send your first friend request.'
              />
            ) : (
              friends.map((friend) => (
                <FriendCard
                  key={friend.requestId}
                  friend={friend}
                  onRemove={removeFriend}
                />
              ))
            )}
          </div>
        )}

        {/* ── Requests Tab ─────────────────────────────────────────────────────── */}
        {!isLoading && tab === "requests" && (
          <div className="space-y-6">
            {/* Received */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Received ({pendingReceived.length})
                </span>
              </div>
              {pendingReceived.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 px-1">No pending requests.</p>
              ) : (
                <div className="space-y-2">
                  {pendingReceived.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 shadow-sm"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: req.profile.avatarColor }}
                      >
                        {(req.profile.displayName || req.profile.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {req.profile.displayName || req.profile.username}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">@{req.profile.username} · wants to be friends</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDecline(req.id)}
                          disabled={pendingActions.has(req.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-500/40 transition-all"
                        >
                          {pendingActions.has(req.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={pendingActions.has(req.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        >
                          {pendingActions.has(req.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Sent ({pendingSent.length})
                </span>
              </div>
              {pendingSent.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 px-1">No sent requests.</p>
              ) : (
                <div className="space-y-2">
                  {pendingSent.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 shadow-sm"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: req.profile.avatarColor }}
                      >
                        {(req.profile.displayName || req.profile.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {req.profile.displayName || req.profile.username}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <p className="text-xs text-amber-600 dark:text-amber-400">Awaiting approval</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancel(req.id)}
                        disabled={pendingActions.has(req.id)}
                        className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-all"
                      >
                        {pendingActions.has(req.id) ? "Cancelling…" : "Cancel"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Discover Tab ─────────────────────────────────────────────────────── */}
        {!isLoading && tab === "discover" && (
          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by username or name…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
              />
              {searching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchQuery.trim().length >= 2
                  ? `${displayUsers.length} result${displayUsers.length !== 1 ? "s" : ""}`
                  : `${allUsers.length} user${allUsers.length !== 1 ? "s" : ""} on Finio`}
              </p>
              <button
                onClick={loadDiscoverUsers}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Finding people…</span>
              </div>
            ) : displayUsers.length === 0 && searchQuery.trim().length >= 2 ? (
              <EmptyState icon={Search} title="No users found" desc="Try a different username or name." />
            ) : displayUsers.length === 0 ? (
              <EmptyState icon={Users} title="No other users yet" desc="Share Finio with friends and they'll appear here." />
            ) : (
              <div className="space-y-2">
                {displayUsers.map((user) => {
                  const status = getUserStatus(user.id);
                  const inFlight = pendingActions.has(user.id);
                  const err = requestErrors[user.id];

                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 shadow-sm"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                        {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
                      </div>

                      {status === "friend" && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg font-medium">
                          <UserCheck className="w-3.5 h-3.5" />
                          Friends
                        </div>
                      )}
                      {status === "sent" && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </div>
                      )}
                      {status === "received" && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg font-medium">
                          <Bell className="w-3.5 h-3.5" />
                          Check Requests
                        </div>
                      )}
                      {status === "none" && (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={inFlight}
                          className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60"
                        >
                          {inFlight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                          {inFlight ? "Sending…" : "Add"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showPrivacy && <PrivacySettingsModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center py-16 text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">{desc}</p>
      </div>
    </div>
  );
}
