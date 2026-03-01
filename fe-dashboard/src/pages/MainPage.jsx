import { useState, useEffect, useCallback } from "react";
import { usePagination } from "../hooks/usePagination";
import { useSort } from "../hooks/useSort";
import { useFilter } from "../hooks/useFilter";
import MainHeader from "../layouts/MainHeader";
import SelectFilter from "../components/Filters/SelectFilter";
import DateFilter from "../components/Filters/DateFilter";
import RangeFilter from "../components/Filters/RangeFilter";
import TableBody from "../components/TableBody";
import TableHeader from "../components/TableHeader";
import Pagination from "../components/Pagination";
import {
  fetchGames,
  fetchLastSync,
  deleteGame,
  syncWithPolling,
} from "../utils/network-data";


function MainPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);

  const { sortKey, sortDir, handleSort, applySorting } = useSort(
    "updated_at",
    "desc",
  );

  const {
    filterGenre,
    setFilterGenre,
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

  const genres = [...new Set(data.map((g) => g.genre).filter(Boolean))];

  // ── Fetch sekali saat mount & setelah sync ────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGames({ pageSize: 100 });
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fetchLastSync()
      .then((log) => {
        if (log?.synced_at)
          setLastSync(new Date(log.synced_at).toLocaleString("id-ID"));
      })
      .catch(() => {});
  }, []);

  // ── Sort & filter ─────────────────────────────────────────────────────────
  const filteredData = applySorting(applyFiltering(search));

  // ── Pagination (setelah filteredData) ─────────────────────────────────────
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    goToPage,
    getPageNumbers,
    PAGE_SIZE,
  } = usePagination(filteredData);

  // Reset ke halaman 1 setiap kali filter/search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterGenre, filterRating, filterPrice, filterDate, setCurrentPage]);

  // ── Sync handler ───────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress(null);
    await syncWithPolling({
      intervalMs: 1500,
      onProgress: (status) => setSyncProgress(status.progress),
      onSuccess: async () => {
        const log = await fetchLastSync().catch(() => null);
        setLastSync(
          log?.synced_at
            ? new Date(log.synced_at).toLocaleString("id-ID")
            : new Date().toLocaleString("id-ID"),
        );
        setSyncing(false);
        setSyncProgress(null);
        setCurrentPage(1);
        loadData();
      },
      onError: (err) => {
        setError(`Sync all gagal: ${err.message}`);
        setSyncing(false);
        setSyncProgress(null);
      },
    });
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteGame(id);
      setData((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(`Gagal menghapus: ${err.message}`);
    }
  };
  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Games</h1>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {syncing && syncProgress && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
          Syncing... {syncProgress.current}/{syncProgress.total} game
          {syncProgress.percent != null && ` (${syncProgress.percent}%)`}
        </div>
      )}

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
        {loading && (
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 text-yellow-700 text-xs">
            Memuat data...
          </div>
        )}

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
                  col="released"
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
                  col="price_cheap"
                  label="Price (Global)"
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
              filteredData={paginatedData}
              handleDelete={handleDelete}
              priceKey="price_cheap"
            />
          </table>
        </div>

        {/* Footer: info + pagination */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Menampilkan{" "}
            {filteredData.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredData.length)} dari{" "}
            {filteredData.length} data
          </span>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            goToPage={goToPage}
            getPageNumbers={getPageNumbers}
            totalData={filteredData.length}
            PAGE_SIZE={PAGE_SIZE}
          />
        </div>
      </div>
    </div>
  );
}

export default MainPage;
