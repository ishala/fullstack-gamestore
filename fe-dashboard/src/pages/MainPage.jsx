import { useState } from "react";
import { useSort } from "../hooks/useSort";
import { useFilter } from "../hooks/useFilter";
import MainHeader from "../layouts/MainHeader";
import SelectFilter from "../components/Filters/SelectFilter";
import DateFilter from "../components/Filters/DateFilter";
import RangeFilter from "../components/Filters/RangeFilter";
import TableBody from "../components/TableBody";
import TableHeader from "../components/TableHeader";
import { mockData } from "../utils/local-data";

function MainPage() {
  const [data, setData] = useState(mockData);
  const [search, setSearch] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const { sortKey, sortDir, handleSort, applySorting } = useSort(
    "updatedAt",
    "desc",
  );
  const {
    filterGenre,
    setFilterGenre,
    filterPlatform,
    setFilterPlatform,
    filterRating,
    setFilterRating,
    filterPrice,
    setFilterPrice,
    filterDate,
    setFilterDate,
    activeFilterCount,
    clearAllFilters,
    applyFiltering,
  } = useFilter(data);

  const genres = [...new Set(data.map((g) => g.genre))];
  const platforms = [...new Set(data.map((g) => g.platform))];

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

  //   Variables
  const filteredData = applySorting(applyFiltering(search));
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
                <TableHeader
                  col="name"
                  label="Nama Game"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  handleSort={handleSort}
                  filterNode={null}
                />
                <TableHeader
                  col="genre"
                  label="Genre"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  handleSort={handleSort}
                  filterNode={
                    <SelectFilter
                      label="Filter Genre"
                      options={genres}
                      value={filterGenre}
                      onChange={setFilterGenre}
                      onClear={() => setFilterGenre("")}
                    />
                  }
                />
                <TableHeader
                  col="releaseDate"
                  label="Release Date"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  handleSort={handleSort}
                  filterNode={
                    <DateFilter
                      value={filterDate}
                      onChange={setFilterDate}
                      onClear={() => setFilterDate({ from: "", to: "" })}
                    />
                  }
                />
                <TableHeader
                  col="platform"
                  label="Platforms"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  handleSort={handleSort}
                  filterNode={
                    <SelectFilter
                      label="Filter Platform"
                      options={platforms}
                      value={filterPlatform}
                      onChange={setFilterPlatform}
                      onClear={() => setFilterPlatform("")}
                    />
                  }
                />
                <TableHeader
                  col="cheapest"
                  label="Price"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  handleSort={handleSort}
                  filterNode={
                    <RangeFilter
                      label="Filter Harga ($)"
                      min={0}
                      max={100}
                      value={filterPrice}
                      onChange={setFilterPrice}
                      onClear={() => setFilterPrice({ min: "", max: "" })}
                      prefix="Masukkan range harga dalam USD"
                    />
                  }
                />
                <TableHeader
                  col="rating"
                  label="Rating"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  handleSort={handleSort}
                  filterNode={
                    <RangeFilter
                      label="Filter Rating"
                      min={0}
                      max={10}
                      value={filterRating}
                      onChange={setFilterRating}
                      onClear={() => setFilterRating({ min: "", max: "" })}
                      prefix="Skala 0.0 – 10.0"
                    />
                  }
                />
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <TableBody
              filteredData={filteredData}
              handleDelete={handleDelete}
              priceKey="cheapest"
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
