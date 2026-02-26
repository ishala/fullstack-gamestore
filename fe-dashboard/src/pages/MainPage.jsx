import { useState } from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import MainHeader from "../layouts/MainHeader";
import SelectFilter from "../components/Filters/SelectFilter";
import DateFilter from "../components/Filters/DateFilter";
import RangeFilter from "../components/Filters/RangeFilter";
// import TableHeader from "../components/TableHeader";
import TableBody from "../components/TableBody";
import { mockData } from "../utils/local-data";

function MainPage() {
  const [data, setData] = useState(mockData);
  const [sortKey, setSortKey] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  const [filterGenre, setFilterGenre] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterRating, setFilterRating] = useState({ min: 0, max: 0 });
  const [filterPrice, setFilterPrice] = useState({ min: 0.0, max: 0.0 });
  const [filterDate, setFilterDate] = useState({ from: "", to: "" });

  const genres = [...new Set(data.map((g) => g.genre))];
  const platforms = [...new Set(data.map((g) => g.platform))];

  const activeFilterCount = [
    filterGenre,
    filterPlatform,
    filterRating.min || filterRating.max,
    filterPrice.min || filterPrice.max,
    filterDate.from || filterDate.to,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterGenre("");
    setFilterPlatform("");
    setFilterRating({ min: "", max: "" });
    setFilterPrice({ min: "", max: "" });
    setFilterDate({ from: "", to: "" });
  };
  //   Handle Sorting Values
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Handle Syncing Data
  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync(new Date().toLocaleString("id-ID"));
    }, 1500);
  };

  // Handle Delete
  const handleDelete = (id) => {
    setData((prev) => prev.filter((g) => g.id !== id));
  };

  // eslint-disable-next-line react/prop-types
  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <FaSort className="text-gray-300" />;
    return sortDir === "asc" ? (
      <FaSortUp className="text-blue-500" />
    ) : (
      <FaSortDown className="text-blue-500" />
    );
  };

  //   Variables
  const filteredData = data
    .filter(
      (g) =>
        (!search || g.name.toLowerCase().includes(search.toLowerCase())) &&
        (!filterGenre || g.genre === filterGenre) &&
        (!filterPlatform || g.platform === filterPlatform) &&
        (!filterRating.min || g.rating >= parseFloat(filterRating.min)) &&
        (!filterRating.max || g.rating <= parseFloat(filterRating.max)) &&
        (!filterPrice.min || g.price >= parseFloat(filterPrice.min)) &&
        (!filterPrice.max || g.price <= parseFloat(filterPrice.max)) &&
        (!filterDate.from || g.releaseDate >= filterDate.from) &&
        (!filterDate.to || g.releaseDate <= filterDate.to),
    )
    .sort((a, b) => {
      const valA = a[sortKey],
        valB = b[sortKey];
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const colHeader = (key, label, filterNode) => (
    <th className="px-4 py-3 text-left">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleSort(key)}
          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 select-none"
        >
          {label}
          <SortIcon col={key} />
        </button>
        {filterNode}
      </div>
    </th>
  );

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Games</h1>

      <MainHeader
        search={search}
        setSearch={setSearch}
        activeFilterCount={activeFilterCount}
        clearAllFilters={clearAllFilters}
        lastSync={lastSync}
        handleSync={handleSync}
        syncing={syncing}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">
                  #
                </th>
                {colHeader("name", "Nama Game", null)}
                {colHeader(
                  "genre",
                  "Genre",
                  // Butuh Peringkas SelectFilter
                  <SelectFilter
                    label="Filter Genre"
                    options={genres}
                    value={filterGenre}
                    onChange={setFilterGenre}
                    onClear={() => setFilterGenre("")}
                  />,
                )}
                {colHeader(
                  "releaseDate",
                  "Release Date",
                  <DateFilter
                    value={filterDate}
                    onChange={setFilterDate}
                    onClear={() => setFilterDate({ from: "", to: "" })}
                  />,
                )}
                {colHeader(
                  "platform",
                  "Platforms",
                  <SelectFilter
                    label="Filter Platform"
                    options={platforms}
                    value={filterPlatform}
                    onChange={setFilterPlatform}
                    onClear={() => setFilterPlatform("")}
                  />,
                )}
                {colHeader(
                  "cheapest",
                  "Price",
                  <RangeFilter
                    label="Filter Harga ($)"
                    min={0}
                    max={100}
                    value={filterPrice}
                    onChange={setFilterPrice}
                    onClear={() => setFilterPrice({ min: "", max: "" })}
                    prefix="Masukkan range harga dalam USD"
                  />,
                )}
                {colHeader(
                  "rating",
                  "Rating",
                  <RangeFilter
                    label="Filter Rating"
                    min={0}
                    max={10}
                    value={filterRating}
                    onChange={setFilterRating}
                    onClear={() => setFilterRating({ min: "", max: "" })}
                    prefix="Skala 0.0 – 10.0"
                  />,
                )}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <TableBody
              filteredData={filteredData}
              handleDelete={handleDelete}
            />
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          Menampilkan {filteredData.length} dari {data.length} data
        </div>
      </div>
    </div>
  );
}

export default MainPage;