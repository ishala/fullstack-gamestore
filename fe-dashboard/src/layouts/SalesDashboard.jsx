import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Line,
  Tooltip,
  Legend,
  BarChart,
  CartesianGrid,
  Bar,
  XAxis,
  YAxis,
  LineChart,
} from "recharts";
import { useState, useEffect } from "react";
import {
  fetchPriceGapByGenre,
  fetchSalesByDate,
  fetchMaxPriceByDate,
} from "../utils/network-data";
import { TOOLTIP_STYLE, COLORS } from "../utils";
import Cards from "../components/Dashboards/Cards";
import ChartCard from "../components/Dashboards/ChartCard";
import Skeleton from "../components/Dashboards/Skeleton";
import PropTypes from "prop-types";

// Custom tooltip pie gap
const GapTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white px-3 py-2 rounded-xl shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{d.name}</p>
      <p className={d.raw_gap >= 0 ? "text-rose-500" : "text-emerald-500"}>
        Gap: {d.raw_gap >= 0 ? "+" : ""}
        {d.raw_gap}
      </p>
      <p className="text-gray-400">
        {d.raw_gap >= 0 ? "Store are more expensive" : "Store are cheaper"}
      </p>
    </div>
  );
};

function SalesDashboard({ dateRange, summary }) {
  const [gapData, setGapData] = useState([]);
  const [byDate, setByDate] = useState([]);
  const [maxByDate, setMaxByDate] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetchPriceGapByGenre(dateRange.start, dateRange.end),
      fetchSalesByDate(dateRange.start, dateRange.end),
      fetchMaxPriceByDate(dateRange.start, dateRange.end),
    ])
      .then(([gap, date, maxDate]) => {
        setGapData(
          gap.map((r) => ({
            name: r.genre,
            value: Math.abs(r.avg_gap),
            raw_gap: r.avg_gap,
          })),
        );
        setByDate(date);
        setMaxByDate(maxDate);
      })
      .catch((e) => console.error("SalesDataView:", e))
      .finally(() => setLoading(false));
  }, [dateRange]);

  const topGapGenre = gapData.length
    ? gapData.reduce((a, b) =>
        Math.abs(a.raw_gap) > Math.abs(b.raw_gap) ? a : b,
      ).name
    : "—";

  return (
    <div className="space-y-8">
      {/* Cards */}
      <Cards
        topGapGenre={topGapGenre}
        summary={summary}
        genreData={[]}
        isSales={true}
      />

      {/* Pie Chart */}
      <ChartCard
        title="🏪 Price Gap per Genre (Toko vs Global)"
        subtitle="Selisih rata-rata our_price vs price_cheap. Merah = toko lebih mahal, Hijau = toko lebih murah."
      >
        {loading ? (
          <Skeleton />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gapData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {gapData.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={
                      d.raw_gap >= 0 ? "#ef4444" : COLORS[i % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<GapTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Dua Column/Line Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="📦 Game Ditambahkan ke Sales per Hari"
          subtitle="COUNT sales dikelompokkan per tanggal (30 hari terakhir)"
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

        <ChartCard
          title="📈 Fluktuasi Harga Tertinggi per Hari"
          subtitle="Jika ada beberapa game ditambah dalam 1 hari, hanya harga tertinggi (MAX our_price) yang ditampilkan."
        >
          {loading ? (
            <Skeleton />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={maxByDate}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => [`$${v}`, "Max Price"]}
                />
                <Line
                  type="monotone"
                  dataKey="max_price"
                  name="Max Price"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
GapTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      payload: PropTypes.shape({
        name: PropTypes.string,
        raw_gap: PropTypes.number,
      }),
    }),
  ),
};

SalesDashboard.propTypes = {
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

export default SalesDashboard;
