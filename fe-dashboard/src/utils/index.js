export const COLORS = [
  "#6366f1", "#06b6d4", "#f59e0b", "#10b981",
  "#ef4444", "#8b5cf6", "#f97316", "#0ea5e9",
];

export const TOOLTIP_STYLE = {
  borderRadius: "10px",
  border: "none",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  fontSize: "12px",
};

export const fmt = (v) => (v != null ? v : "—");
export const fmtPrice = (v) => (v != null ? `$${v}` : "—");

export const cardsInfo = (topGapGenre, summary, genreData, isSales = false) => {
  const gamesCards = [
    {
      label: "Total Games",
      value: summary.total_games,
      icon: "🎮",
      color: "text-indigo-600",
    },
    {
      label: "Avg Cheapest Global Price",
      value: fmtPrice(summary.avg_global_price),
      icon: "💲",
      color: "text-cyan-600",
    },
    {
      label: "Most Popular Genre",
      value: genreData[0]?.name ?? "—",
      icon: "🏆",
      color: "text-amber-600",
    },
    {
      label: "Total Genre",
      value: genreData.length || "—",
      icon: "📂",
      color: "text-emerald-600",
    },
  ];

  const salesCards = [
    {
      label: "Total Sales",
      value: fmt(summary.total_sales),
      icon: "🛒",
      color: "text-indigo-600",
    },
    {
      label: "Avg Our Price",
      value: fmtPrice(summary.avg_our_price),
      icon: "🏷️",
      color: "text-cyan-600",
    },
    {
      label: "Avg Global Price",
      value: fmtPrice(summary.avg_global_price),
      icon: "🌐",
      color: "text-amber-600",
    },
    {
      label: "Biggest Genre Price Gap",
      value: topGapGenre,
      icon: "📊",
      color: "text-rose-600",
    },
  ];

  return isSales ? salesCards : gamesCards;
};