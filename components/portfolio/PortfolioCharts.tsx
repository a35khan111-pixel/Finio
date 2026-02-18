"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { usePortfolioStore, ASSET_CATEGORY_META } from "@/store/usePortfolioStore";
import { formatCurrency } from "@/utils/formatters";

export function AssetAllocationChart() {
  const { getAssetsByCategory, getTotalAssets } = usePortfolioStore();
  const byCategory = getAssetsByCategory();
  const total = getTotalAssets();

  const data = Object.entries(byCategory)
    .filter(([, value]) => value > 0)
    .map(([cat, value]) => ({
      name: ASSET_CATEGORY_META[cat as keyof typeof ASSET_CATEGORY_META].label,
      icon: ASSET_CATEGORY_META[cat as keyof typeof ASSET_CATEGORY_META].icon,
      value,
      color: ASSET_CATEGORY_META[cat as keyof typeof ASSET_CATEGORY_META].color,
      pct: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
    }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm">Add assets to see allocation</p>
      </div>
    );
  }

  return (
    <div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {d.icon} {d.name}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatCurrency(d.value)} · {d.pct}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-slate-600 dark:text-slate-400 flex-1 truncate">{d.name}</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">{d.pct}%</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 w-20 text-right">
              {formatCurrency(d.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NetWorthHistoryChart() {
  const { snapshots } = usePortfolioStore();

  if (snapshots.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <span className="text-3xl mb-2">📈</span>
        <p className="text-sm">Net worth history will appear here</p>
        <p className="text-xs mt-1 max-w-[200px] text-center">
          Update your portfolio on different days to track changes
        </p>
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    date: new Date(s.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    netWorth: s.netWorth,
    assets: s.totalAssets,
    liabilities: s.totalLiabilities,
  }));

  const minVal = Math.min(...data.map((d) => d.netWorth));
  const maxVal = Math.max(...data.map((d) => d.assets));
  const isPositive = data[data.length - 1].netWorth >= data[0].netWorth;

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            interval={Math.max(0, Math.floor(data.length / 5) - 1)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            domain={[Math.min(0, minVal * 1.1), maxVal * 1.05]}
          />
          <ReferenceLine y={0} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 4" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs space-y-1">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                    {payload.map((p, i) => (
                      <p key={i} className="font-semibold" style={{ color: p.color }}>
                        {p.name}: {formatCurrency(p.value as number)}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="assets"
            name="Assets"
            stroke="#22c55e"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="liabilities"
            name="Liabilities"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            name="Net Worth"
            stroke={isPositive ? "#6366f1" : "#f97316"}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: isPositive ? "#6366f1" : "#f97316" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
