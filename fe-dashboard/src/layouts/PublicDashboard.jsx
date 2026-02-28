import { useState, useEffect } from "react";
import Cards from "../components/Dashboards/Cards";
import ChartCard from "../components/Dashboards/ChartCard";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  CartesianGrid,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS, TOOLTIP_STYLE } from "../utils";
import Skeleton from "../components/Dashboards/Skeleton";
import PropTypes from "prop-types";
import {
  fetchPriceRangeByGenre,
  fetchGamesByDate,
  fetchAvgRatingByGenre,
} from "../utils/network-data";

function PublicDashboard({ dateRange, summary }) {
  const [genreData, setGenreData] = useState([]);
  const [byDate, setByDate] = useState([]);
  const [avgPrice, setAvgPrice] = useState([]);
  const [avgRating, setAvgRating] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetchPriceRangeByGenre(dateRange.start, dateRange.end),
      fetchGamesByDate(dateRange.start, dateRange.end),
      fetchAvgRatingByGenre(dateRange.start, dateRange.end),
    ])
      .then(([genre, date, rating]) => {
        setGenreData(
          genre.map((r) => ({ name: r.genre, value: r.game_count })),
        );
        setAvgPrice(
          genre.map((r) => ({ genre: r.genre, avg_price: r.avg_price })),
        );
        setByDate(date);
        setAvgRating(rating);
      })
      .catch((e) => console.error("PublicDataView:", e))
      .finally(() => setLoading(false));
  }, [dateRange]);

  return (
    <div className="space-y-8">
      {/* Cards */}
      <Cards
        topGapGenre={[]}
        summary={summary}
        genreData={genreData}
        isSales={false}
      />

      {/* Pie + Column */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="🎮 Game Distribution by Genre"
          subtitle="Count of games by genre"
        >
          {loading ? (
            <Skeleton />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={genreData}
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
                  {genreData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard
          title="📆 Game Updated by Date"
          subtitle="Count of games updated by date"
        >
          {loading ? (
            <Skeleton />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={byDate}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="count"
                  name="Jumlah Game"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Analitik Tambahan ── */}
      <div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard
            title="💲 Mean of Cheapest Price by Genre"
            subtitle="Mean of global cheapest price grouped by genre"
          >
            {loading ? (
              <Skeleton />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={avgPrice}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    dataKey="genre"
                    type="category"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [`$${v}`, "Avg Cheapest"]}
                  />
                  <Bar
                    dataKey="avg_price"
                    name="Avg Cheapest"
                    fill="#06b6d4"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="⭐ Rating Means by Genre"
            subtitle="Rating means by genre scaled 0-5"
          >
            {loading ? (
              <Skeleton />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={avgRating}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    domain={[0, 5]}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                  />
                  <YAxis
                    dataKey="genre"
                    type="category"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [v, "Avg Rating"]}
                  />
                  <Bar
                    dataKey="avg_rating"
                    name="Avg Rating"
                    fill="#f59e0b"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

PublicDashboard.propTypes = {
  dateRange: PropTypes.shape({
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
  }),
  summary: PropTypes.shape({
    total_games: PropTypes.number,
    total_sales: PropTypes.number,
    avg_global_price: PropTypes.number,
    avg_our_price: PropTypes.number,
  }),
};

export default PublicDashboard;
