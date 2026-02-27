import { useState, useRef, useEffect } from "react";
import SearchField from "../components/SearchField";
import TableHeader from "../components/TableHeader";
import TableBody from "../components/TableBody";
import { mockData, COLUMNS } from "../utils/local-data";
import { useSort } from "../hooks/useSort";

function MyStorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [price, setPrice] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [storeGames, setStoreGames] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { sortKey, sortDir, handleSort, applySorting } = useSort("name", "asc");
  const sortedStoreGames = applySorting(storeGames);

  const searchRef = useRef(null);
  const filtered =
    searchQuery.trim().length > 0
      ? mockData.filter(
          (g) =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !storeGames.find((s) => s.id === g.id),
        )
      : [];

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setSearchQuery(game.name);
    setDropdownOpen(false);
    setError("");
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setSelectedGame(null);
    setDropdownOpen(true);
    setError("");
    setSuccess("");
  };

  const handlePriceChange = (e) => {
    setPrice(e.target.value.replace(/[^0-9.]/g, ""));
    setError("");
  };

  const handleAdd = () => {
    if (!selectedGame)
      return setError("Pilih game dari dropdown terlebih dahulu.");
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)
      return setError("Masukkan harga yang valid.");

    const entry = { ...selectedGame, ourPrice: parseFloat(price).toFixed(2) };
    setStoreGames((prev) => [entry, ...prev]);
    setSearchQuery("");
    setPrice("");
    setSelectedGame(null);
    setError("");
    setSuccess(`"${entry.name}" berhasil ditambahkan ke toko!`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDelete = (id) => {
    setStoreGames((prev) => prev.filter((g) => g.id !== id));
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
                placeholder="Masukkan nama game..."
              />

              {/* Dropdown */}
              {dropdownOpen && searchQuery && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                  {filtered.length > 0 ? (
                    filtered.map((game) => (
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
                            {game.genre}
                          </span>
                          <span className="text-xs text-slate-400">
                            {game.platform}
                          </span>
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
        {storeGames.length === 0 ? (
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
                  {COLUMNS.filter((col) => col.key !== "cheapest").map(
                    (col) => (
                      <TableHeader
                        key={col.key}
                        col={col.key}
                        label={col.label}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        handleSort={handleSort}
                        filterNode={null}
                      />
                    ),
                  )}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <TableBody
                filteredData={sortedStoreGames}
                handleDelete={handleDelete}
                priceKey="ourPrice"
              />
            </table>
            <div className="px-5 py-3 text-xs text-slate-400 border-t border-slate-100">
              Menampilkan {storeGames.length} dari {storeGames.length} game di
              toko
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyStorePage;
