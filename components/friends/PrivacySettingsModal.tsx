"use client";

import { useState } from "react";
import { X, Shield, DollarSign, BarChart2, Receipt, Tag, TrendingUp, Edit3, CheckCircle2, AlertCircle } from "lucide-react";
import { useFriendsStore } from "@/store/useFriendsStore";

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#10b981", "#06b6d4",
  "#3b82f6", "#84cc16",
];

interface PrivacySettingsModalProps {
  onClose: () => void;
}

export function PrivacySettingsModal({ onClose }: PrivacySettingsModalProps) {
  const { myProfile, myPrivacy, updatePrivacy, updateProfile } = useFriendsStore();

  const [editingProfile, setEditingProfile] = useState(false);
  const [username, setUsername] = useState(myProfile?.username ?? "");
  const [displayName, setDisplayName] = useState(myProfile?.displayName ?? "");
  const [selectedColor, setSelectedColor] = useState(myProfile?.avatarColor ?? "#6366f1");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  async function saveProfile() {
    if (!username.trim()) return;
    setProfileSaving(true);
    setProfileError(null);
    const err = await updateProfile({
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
      displayName: displayName.trim() || null!,
      avatarColor: selectedColor,
    });
    setProfileSaving(false);
    if (err) { setProfileError(err); } else { setProfileSaved(true); setEditingProfile(false); }
  }

  const toggleItem = (key: keyof typeof myPrivacy) => {
    updatePrivacy({ [key]: !myPrivacy[key] });
  };

  const privacyItems = [
    {
      key: "showCategories" as const,
      icon: Tag,
      label: "Budget Categories",
      desc: "Your category names and colors",
      color: "indigo",
    },
    {
      key: "showBudgets" as const,
      icon: BarChart2,
      label: "Budget Allocations",
      desc: "How much you've budgeted per category",
      color: "violet",
    },
    {
      key: "showExpenses" as const,
      icon: Receipt,
      label: "Expenses",
      desc: "Your spending history",
      color: "amber",
    },
    {
      key: "showIncome" as const,
      icon: DollarSign,
      label: "Monthly Income",
      desc: "Your income amount",
      color: "emerald",
    },
    {
      key: "showPortfolio" as const,
      icon: TrendingUp,
      label: "Portfolio",
      desc: "Assets, liabilities and net worth",
      color: "cyan",
    },
  ];

  const initials = (myProfile?.displayName || myProfile?.username || "?").slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Profile & Privacy</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Control what friends can see</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your Profile</h3>
              {!editingProfile && (
                <button
                  onClick={() => { setEditingProfile(true); setProfileSaved(false); }}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>

            {!editingProfile ? (
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: myProfile?.avatarColor ?? "#6366f1" }}
                >
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {myProfile?.displayName || myProfile?.username || "No profile"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">@{myProfile?.username || "—"}</p>
                  {profileSaved && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                {profileError && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {profileError}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Display Name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Avatar Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-7 h-7 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800 scale-110" : ""}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setEditingProfile(false); setProfileError(null); }}
                    className="flex-1 py-2 text-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={profileSaving || !username.trim()}
                    className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {profileSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy toggles */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Visible to Friends
            </h3>
            <div className="space-y-2">
              {privacyItems.map(({ key, icon: Icon, label, desc }) => {
                const enabled = myPrivacy[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleItem(key)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left ${
                      enabled
                        ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30"
                        : "bg-slate-50 dark:bg-slate-800 border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${enabled ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${enabled ? "text-indigo-900 dark:text-indigo-200" : "text-slate-600 dark:text-slate-400"}`}>
                        {label}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
                    </div>
                    {/* Toggle */}
                    <div className={`w-10 h-6 rounded-full transition-colors shrink-0 relative ${enabled ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? "left-5" : "left-1"}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
