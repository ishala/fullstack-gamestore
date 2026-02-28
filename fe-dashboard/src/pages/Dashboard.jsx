import { useState, useEffect } from "react";
import dayjs from "dayjs";
import PublicDashboard from "../layouts/PublicDashboard";
import SalesDashboard from "../layouts/SalesDashboard";
import { fetchDashboardSummary } from "../utils/network-data";

// =============================================================================
// MAIN DASHBOARD
// =============================================================================
export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
    end: dayjs().format("YYYY-MM-DD"),
  });

  const [viewMode, setViewMode] = useState("public");

  const [summary, setSummary] = useState({
    total_games: null,
    total_sales: null,
    avg_global_price: null,
    avg_our_price: null,
  });

  useEffect(() => {
    fetchDashboardSummary()
      .then(setSummary)
      .catch((e) => console.error("Summary:", e));
  }, []);

  const resetDate = () =>
    setDateRange({
      start: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
      end: dayjs().format("YYYY-MM-DD"),
    });

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      {/* ── HEADER + DROPDOWN ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {viewMode === "public" ? "Game from Public API" : "Sales Data"}
          </p>
        </div>

        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="text-sm font-semibold border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
        >
          <option value="public">🌐 Data Public</option>
          <option value="sales">🛒 Data Sales</option>
        </select>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-gray-600">
          📅 Date Range
        </span>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateRange.start}
            max={dateRange.end}
            onChange={(e) =>
              setDateRange((p) => ({ ...p, start: e.target.value }))
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <span className="text-gray-400 font-medium">→</span>
          <input
            type="date"
            value={dateRange.end}
            min={dateRange.start}
            max={dayjs().format("YYYY-MM-DD")}
            onChange={(e) =>
              setDateRange((p) => ({ ...p, end: e.target.value }))
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={resetDate}
          className="text-xs text-indigo-500 hover:text-indigo-700 underline"
        >
          Reset to the last month
        </button>
        <span className="ml-auto text-xs text-gray-400 italic">
          Applies to all charts
        </span>
      </div>

      {/* ── Content ── */}
      {viewMode === "public" ? (
        <PublicDashboard dateRange={dateRange} summary={summary} />
      ) : (
        <SalesDashboard dateRange={dateRange} summary={summary} />
      )}
    </div>
  );
}
