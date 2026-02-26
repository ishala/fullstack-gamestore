import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import dayjs from "dayjs";
import {
  dummySummary,
  dummyGenreChart,
  dummyStoreChart,
  dummyGamesPerDate,
  dummyDealsPerDate,
} from "../utils/local-data";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
];

function Dashboard() {
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
    end: dayjs().format("YYYY-MM-DD"),
  });

  const [summaryData, setSummaryData] = useState({
    totalGames: 0,
    totalDeals: 0,
    topGenre: "-",
    latestGame: "-",
  });

  const [genreChartData, setGenreChartData] = useState([]);
  const [storeChartData, setStoreChartData] = useState([]);
  const [gamesPerDateData, setGamesPerDateData] = useState([]);
  const [dealsPerDateData, setDealsPerDateData] = useState([]);

  // FIX 1: Hapus async/await — dummy data bukan Promise
  const fetchDashboardData = () => {
    try {
      setSummaryData(dummySummary);
      setGenreChartData(dummyGenreChart);
      setStoreChartData(dummyStoreChart);
      setGamesPerDateData(dummyGamesPerDate);
      setDealsPerDateData(dummyDealsPerDate);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  useEffect(() => {
    if (!summaryData || genreChartData.length === 0) return; // tunggu data terisi

    console.log("Summary Data", summaryData);
    console.log("Genre Chart Data", genreChartData);
    console.log("Store Chart Data", storeChartData);
    console.log("Games per Date Data", gamesPerDateData);
    console.log("Deals per Date Data", dealsPerDateData);
  }, [
    summaryData,
    genreChartData,
    storeChartData,
    gamesPerDateData,
    dealsPerDateData,
  ]);

  // FIX 2: summaryCards dipindah ke dalam komponen agar bisa akses summaryData
  const summaryCards = [
    {
      label: "Total Games",
      value: summaryData.totalGames,
      icon: "🎮",
      color: "text-indigo-600",
    },
    {
      label: "Total Deals",
      value: summaryData.totalDeals,
      icon: "💰",
      color: "text-cyan-600",
    },
    {
      label: "Top Genre",
      value: summaryData.topGenre,
      icon: "🏆",
      color: "text-amber-600",
    },
    {
      label: "Latest Game",
      value: summaryData.latestGame,
      icon: "🆕",
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Ringkasan data game & deals dari API publik
        </p>
      </div>

      {/* ── DATE RANGE FILTER ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-gray-600">
          📅 Date Range
        </span>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <span className="text-gray-400 font-medium">→</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <span className="ml-auto text-xs text-gray-400 italic">
          Mempengaruhi semua chart di bawah
        </span>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl">{card.icon}</div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                {card.label}
              </p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.value ?? "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── PIE CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Pie: Games by Genre */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-5">
            🎮 Games by Genre
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={genreChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {genreChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pie: Deals by Store */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-5">
            🏪 Deals by Store
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={storeChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {storeChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── COLUMN / BAR CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar: Games per Date */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-5">
            📆 Games Added per Date
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            {/* FIX 4: gamesPerDate → gamesPerDateData */}
            <BarChart
              data={gamesPerDateData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: Deals per Date */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-5">
            📆 Deals Added per Date
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            {/* FIX 4: dealsPerDate → dealsPerDateData */}
            <BarChart
              data={dealsPerDateData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
