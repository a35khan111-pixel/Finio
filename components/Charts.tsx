"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useBudgetStore } from "@/store/useBudgetStore";
import {
  formatCurrency,
  CATEGORY_ICONS,
  getDailySpendingData,
} from "@/utils/formatters";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
        {label && (
          <p className="text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            {label}
          </p>
        )}
        {payload.map((entry, i) => (
          <p key={i} className="font-semibold text-slate-900 dark:text-white">
            <span style={{ color: entry.color }}>●</span>{" "}
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SpendingPieChart() {
  const { categories, getCategorySpent } = useBudgetStore();

  const data = categories
    .map((cat) => ({
      name: cat.name,
      value: getCategorySpent(cat.id),
      color: cat.color,
      icon: CATEGORY_ICONS[cat.icon] || "💰",
    }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm">No spending data yet</p>
      </div>
    );
  }

  return (
    <div className="h-56">
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
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
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
                      {formatCurrency(d.value)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
        {data.slice(0, 5).map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BudgetVsActualChart() {
  const { categories, getCategoryBudget, getCategorySpent } = useBudgetStore();

  const data = categories
    .map((cat) => ({
      name: cat.name.split(" ")[0],
      budget: getCategoryBudget(cat.id),
      spent: getCategorySpent(cat.id),
      color: cat.color,
    }))
    .filter((d) => d.budget > 0 || d.spent > 0);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm">No budget data yet</p>
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          barSize={12}
          barGap={3}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148,163,184,0.15)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
          <Bar dataKey="spent" name="Spent" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.spent > entry.budget ? "#ef4444" : "#6366f1"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailySpendingChart() {
  const { expenses, periodStart, periodEnd } = useBudgetStore();
  const data = getDailySpendingData(expenses, periodStart, periodEnd);

  if (data.every((d) => d.amount === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <span className="text-3xl mb-2">📈</span>
        <p className="text-sm">No spending data yet</p>
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148,163,184,0.15)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
                    <p className="text-slate-500 dark:text-slate-400 mb-1">Day {label}</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            name="Spent"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#6366f1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
