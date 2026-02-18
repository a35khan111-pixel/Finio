"use client";

import { useState, useRef, useEffect } from "react";
import { useBudgetStore } from "@/store/useBudgetStore";
import { ChevronLeft, ChevronRight, CalendarDays, Calendar, Check } from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";

export function PeriodPicker() {
  const {
    periodMode,
    periodStart,
    periodEnd,
    getPeriodLabel,
    navigatePeriod,
    setCustomPeriod,
    setMonthlyPeriod,
  } = useBudgetStore();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"monthly" | "custom">(periodMode);
  const [customStart, setCustomStart] = useState(periodStart);
  const [customEnd, setCustomEnd] = useState(periodEnd);
  const [monthInput, setMonthInput] = useState(periodStart.slice(0, 7)); // "YYYY-MM"
  const ref = useRef<HTMLDivElement>(null);

  // Sync local state when popover opens
  useEffect(() => {
    if (open) {
      setTab(periodMode);
      setCustomStart(periodStart);
      setCustomEnd(periodEnd);
      setMonthInput(periodStart.slice(0, 7));
    }
  }, [open, periodMode, periodStart, periodEnd]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const periodDays =
    differenceInCalendarDays(parseISO(periodEnd), parseISO(periodStart)) + 1;

  const handleApply = () => {
    if (tab === "monthly") {
      setMonthlyPeriod(monthInput);
    } else {
      if (customStart && customEnd && customStart <= customEnd) {
        setCustomPeriod(customStart, customEnd);
      }
    }
    setOpen(false);
  };

  const label = getPeriodLabel();

  return (
    <div className="relative flex items-center gap-1" ref={ref}>
      {/* Prev arrow */}
      <button
        onClick={() => navigatePeriod("prev")}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
        title="Previous period"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Period label button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
          open
            ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:text-indigo-700 dark:hover:text-indigo-300"
        }`}
      >
        {periodMode === "custom" ? (
          <CalendarDays className="w-3.5 h-3.5" />
        ) : (
          <Calendar className="w-3.5 h-3.5" />
        )}
        <span className="max-w-[160px] truncate">{label}</span>
        {periodMode === "custom" && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 ml-0.5">
            {periodDays}d
          </span>
        )}
      </button>

      {/* Next arrow */}
      <button
        onClick={() => navigatePeriod("next")}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
        title="Next period"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setTab("monthly")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                tab === "monthly"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Monthly
            </button>
            <button
              onClick={() => setTab("custom")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                tab === "custom"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Custom Range
            </button>
          </div>

          <div className="p-4 space-y-4">
            {tab === "monthly" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Select Month
                </label>
                <input
                  type="month"
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                {/* Quick month shortcuts */}
                <div className="mt-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Quick pick</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[-2, -1, 0, 1, 2, 3].map((offset) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + offset);
                      const val = format(d, "yyyy-MM");
                      const lbl = format(d, "MMM yyyy");
                      const isSelected = monthInput === val;
                      return (
                        <button
                          key={offset}
                          onClick={() => setMonthInput(val)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-0.5" />}
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Duration indicator */}
                {customStart && customEnd && customStart <= customEnd && (
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Duration</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {differenceInCalendarDays(
                        parseISO(customEnd),
                        parseISO(customStart)
                      ) + 1}{" "}
                      days
                    </span>
                  </div>
                )}

                {/* Quick range presets */}
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Quick ranges</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Last 7 days", days: 7 },
                      { label: "Last 14 days", days: 14 },
                      { label: "Last 30 days", days: 30 },
                      { label: "Last 90 days", days: 90 },
                    ].map(({ label, days }) => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - days + 1);
                      const s = format(start, "yyyy-MM-dd");
                      const e = format(end, "yyyy-MM-dd");
                      const isSelected = customStart === s && customEnd === e;
                      return (
                        <button
                          key={days}
                          onClick={() => {
                            setCustomStart(s);
                            setCustomEnd(e);
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-left ${
                            isSelected
                              ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400"
                          }`}
                        >
                          {isSelected && "✓ "}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Paycheck cycle helper */}
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Paycheck cycles (from today)</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Bi-weekly", days: 14 },
                      { label: "Semi-monthly", days: 15 },
                      { label: "4-week", days: 28 },
                      { label: "Bi-monthly", days: 60 },
                    ].map(({ label, days }) => {
                      const start = new Date();
                      const end = new Date();
                      end.setDate(start.getDate() + days - 1);
                      const s = format(start, "yyyy-MM-dd");
                      const e = format(end, "yyyy-MM-dd");
                      return (
                        <button
                          key={label}
                          onClick={() => {
                            setCustomStart(s);
                            setCustomEnd(e);
                          }}
                          className="py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left"
                        >
                          {label} ({days}d)
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Apply button */}
            <button
              onClick={handleApply}
              disabled={
                tab === "custom" &&
                (!customStart || !customEnd || customStart > customEnd)
              }
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-500/20"
            >
              Apply Period
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
