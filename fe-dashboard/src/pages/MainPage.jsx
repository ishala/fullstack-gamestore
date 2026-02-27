import { useState, useEffect, useCallback } from "react";
import { useSort } from "../hooks/useSort";
import { useFilter } from "../hooks/useFilter";
import MainHeader from "../layouts/MainHeader";
import SelectFilter from "../components/Filters/SelectFilter";
import DateFilter from "../components/Filters/DateFilter";
import RangeFilter from "../components/Filters/RangeFilter";
import TableBody from "../components/TableBody";
import TableHeader from "../components/TableHeader";
import {
  fetchGames,
  fetchLastSyncGames,
  syncWithPolling,
  fetchLastSync,
  deleteGame
} from "../utils/network-data";

function MainPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
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

  // ── Derived filter options dari data yang ada di halaman ini ───────────────
  const genres = [...new Set(data.map((g) => g.genre).filter(Boolean))];

  // ── Load data dari backend ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGames({
        pageSize: 100,
        sortBy: sortKey,
        sortDir,
        search: search || undefined,
        genre: filterGenre || undefined,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sortKey, sortDir, search, filterGenre]);

  // Load awal + tiap kali sort/search/filter genre berubah
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load last sync info saat mount
  useEffect(() => {
    fetchLastSyncGames()
      .then((log) => {
        if (log?.synced_at) {
          setLastSync(
            new Date(log.synced_at).toLocaleString("id-ID"),
          );
        }
      })
      .catch(() => {}); // silent — last sync tidak kritis
  }, []);

  // ── Sync handler ───────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress(null);

    await syncWithPolling({
      limit: 40,
      intervalMs: 1500,
      onProgress: (status) => {
        setSyncProgress(status.progress);
      },
      onSuccess: async () => {
        const log = await fetchLastSync().catch(() => null);
        setLastSync(
          log?.synced_at
            ? new Date(log.synced_at).toLocaleString("id-ID")
            : new Date().toLocaleString("id-ID"),
        );
        setSyncing(false);
        setSyncProgress(null);
        loadData(); // refresh tabel setelah sync
      },
      onError: (err) => {
        console.error("Sync error:", err);
        setError(`Sync gagal: ${err.message}`);
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
      setTotal((prev) => prev - 1);
    } catch (err) {
      setError(`Gagal menghapus: ${err.message}`);
    }
  };

  // ── Filter + sort di client (untuk range price, rating, date) ──────────────
  const filteredData = applySorting(applyFiltering(search));

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Games</h1>

      {/* Error Banner */}
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

      {/* Sync Progress */}
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
        {/* Loading overlay */}
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
              filteredData={filteredData}
              handleDelete={handleDelete}
              priceKey="price_cheap"
            />
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          Menampilkan {filteredData.length} dari {total} data
        </div>
      </div>
    </div>
  );
}

export default MainPage;