import { useState, useRef, useEffect, useCallback } from "react";
import SearchField from "../components/SearchField";
import TableHeader from "../components/TableHeader";
import TableBody from "../components/TableBody";
import { useSort } from "../hooks/useSort";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";
import {
  fetchGames,
  fetchSales,
  createSale,
  deleteSale,
  updateSale
} from "../utils/network-data";

function MyStorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [price, setPrice] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Hasil pencarian dari DB
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Data toko (sales dari backend)
  const [storeGames, setStoreGames] = useState([]);
  const [loadingStore, setLoadingStore] = useState(false);

  // Edit Harga
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  const { sortKey, sortDir, handleSort, applySorting } = useSort(
    "game_name",
    "asc",
  );
  const sortedStoreGames = applySorting(storeGames);

  const searchRef = useRef(null);
  const searchTimeout = useRef(null);
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    goToPage,
    getPageNumbers,
    PAGE_SIZE,
  } = usePagination(sortedStoreGames);

  // ── Load sales dari backend saat mount ──────────────────────────────────
  const loadStoreGames = useCallback(async () => {
    setLoadingStore(true);
    try {
      const result = await fetchSales({ pageSize: 100 });
      setStoreGames(result.data);
    } catch (err) {
      setError(`Gagal memuat data toko: ${err.message}`);
    } finally {
      setLoadingStore(false);
    }
  }, []);

  useEffect(() => {
    loadStoreGames();
  }, [loadStoreGames]);

  // ── Tutup dropdown saat klik luar ────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Search ke DB dengan debounce 400ms ───────────────────────────────────
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setSelectedGame(null);
    setError("");
    setSuccess("");

    if (!val.trim()) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }

    setDropdownOpen(true);

    // Debounce — tunggu user berhenti mengetik
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await fetchGames({ search: val.trim(), pageSize: 20 });
        // Filter game yang sudah ada di toko
        const existingGameIds = new Set(storeGames.map((s) => s.game_id));
        setSearchResults(result.data.filter((g) => !existingGameIds.has(g.id)));
      } catch (_) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setSearchQuery(game.name);
    setDropdownOpen(false);
    setSearchResults([]);
    setError("");
  };

  const handlePriceChange = (e) => {
    setPrice(e.target.value.replace(/[^0-9.]/g, ""));
    setError("");
  };

  // ── Tambah game ke toko (POST /sales) ────────────────────────────────────
  const handleAdd = async () => {
    if (!selectedGame)
      return setError("Pilih game dari dropdown terlebih dahulu.");
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)
      return setError("Masukkan harga yang valid.");

    try {
      await createSale({
        game_id: selectedGame.id,
        our_price: parseFloat(price),
      });
      setSearchQuery("");
      setPrice("");
      setSelectedGame(null);
      setError("");
      setSuccess(`"${selectedGame.name}" berhasil ditambahkan ke toko!`);
      setTimeout(() => setSuccess(""), 3000);
      setCurrentPage(1);
      loadStoreGames(); // refresh tabel
    } catch (err) {
      setError(`Gagal menambahkan: ${err.message}`);
    }
  };

  // ── Hapus sale dari toko (DELETE /sales/:id) ─────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteSale(id);
      setStoreGames((prev) => prev.filter((g) => g.id !== id));
      setCurrentPage(1);
    } catch (err) {
      setError(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleEditStart = (game) => {
    setEditingId(game.id);
    setEditPrice(String(game.our_price));
  };

  const handleEditSave = async (id) => {
    if (
      !editPrice ||
      isNaN(parseFloat(editPrice)) ||
      parseFloat(editPrice) <= 0
    ) {
      setError("Masukkan harga yang valid.");
      return;
    }
    try {
      await updateSale(id, { our_price: parseFloat(editPrice) });
      setStoreGames((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, our_price: parseFloat(editPrice) } : g,
        ),
      );
      setEditingId(null);
      setEditPrice("");
    } catch (err) {
      setError(`Gagal mengupdate: ${err.message}`);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditPrice("");
  };
  return (
    <div className="min-h-screen bg-slate-100 px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Store
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola game yang dijual di toko kamu
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 text-slate-100 rounded-xl px-4 py-2 text-sm font-bold">
          <span className="text-lg">🎮</span>
          <span>{storeGames.length} game</span>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Game Search */}
          <div
            className="flex-1 min-w-[220px] flex flex-col gap-1.5 relative"
            ref={searchRef}
          >
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Nama Game
            </label>
            <div className="relative">
              <SearchField
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setDropdownOpen(true)}
                placeholder="Cari game dari database..."
              />

              {/* Dropdown hasil pencarian */}
              {dropdownOpen && searchQuery && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                  {searching ? (
                    <div className="px-4 py-4 text-slate-400 text-sm text-center">
                      Mencari...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((game) => (
                      <div
                        key={game.id}
                        onMouseDown={() => handleSelectGame(game)}
                        className="px-4 py-3 cursor-pointer hover:bg-slate-800 border-b border-slate-800 last:border-0 transition-colors"
                      >
                        <div className="text-slate-100 font-semibold text-sm">
                          {game.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-blue-900 text-blue-300 font-semibold px-2 py-0.5 rounded">
                            {game.genre ?? "-"}
                          </span>
                          {game.price_cheap != null && (
                            <span className="text-xs text-slate-400">
                              Global: ${Number(game.price_cheap).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-slate-400 text-sm text-center">
                      Game tidak ditemukan atau sudah ada di toko
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Price Input */}
          <div className="w-48 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Harga Toko
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold pointer-events-none select-none">
                $
              </span>
              <input
                type="text"
                placeholder="0.00"
                value={price}
                onChange={handlePriceChange}
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Add Button */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-transparent select-none">.</label>
            <button
              onClick={handleAdd}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
            >
              + Tambah ke Toko
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mt-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="mt-3 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            ✓ {success}
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loadingStore ? (
          <div className="px-4 py-3 bg-yellow-50 text-yellow-700 text-xs">
            Memuat data toko...
          </div>
        ) : storeGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Toko masih kosong
            </h3>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Tambahkan game menggunakan form di atas untuk mulai mengisi toko
              kamu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">
                    #
                  </th>
                  <TableHeader
                    key="game_name"
                    col="game_name"
                    label="Nama Game"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    handleSort={handleSort}
                  />
                  <TableHeader
                    col="game_genre"
                    label="Genre"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    handleSort={handleSort}
                  />
                  <TableHeader
                    col="our_price"
                    label="Store Price"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    handleSort={handleSort}
                  />
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <TableBody
                filteredData={paginatedData}
                handleDelete={handleDelete}
                priceKey="our_price"
                fieldMap={{
                  name: "game_name",
                  genre: "game_genre",
                }}
                columns={["name", "genre", "price"]}
                editingId={editingId}
                editPrice={editPrice}
                setEditPrice={setEditPrice}
                onEditStart={handleEditStart}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
              />
            </table>
            {/* Footer: info + pagination */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Menampilkan{" "}
                {sortedStoreGames.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
                –{Math.min(currentPage * PAGE_SIZE, sortedStoreGames.length)}{" "}
                dari {sortedStoreGames.length} data
              </span>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                goToPage={goToPage}
                getPageNumbers={getPageNumbers}
                totalData={sortedStoreGames.length}
                PAGE_SIZE={PAGE_SIZE}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyStorePage;
