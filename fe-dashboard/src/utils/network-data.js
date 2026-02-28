const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const API = `${BASE_URL}/api/v1`;

// ─── Helper ───────────────────────────────────────────────────────────────────
// Fetch API Wrapper
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.detail ?? JSON.stringify(err);
    } catch (_) {
      // response bukan JSON, pakai status saja
    }
    throw new Error(message);
  }

  // 204 No Content — tidak ada body
  if (res.status === 204) return null;

  return res.json();
}

// Fetching Games
export async function fetchGames({
  page = 1,
  pageSize = 100,
  search,
  genre,
  sortBy = "updated_at",
  sortDir = "desc",
} = {}) {
  const qs = new URLSearchParams({
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_dir: sortDir,
  });
  if (search) qs.set("search", search);
  if (genre) qs.set("genre", genre);

  return apiFetch(`/games?${qs.toString()}`);
}

/**
 * Hapus sale berdasarkan ID.
 *
 * @param {number} saleId
 * @returns {Promise<string>}
 */
export async function deleteGame(gameId) {
    return apiFetch(`/games/${gameId}`, { method: "DELETE" });
}

/**
 * Ambil last sync dari /games/last-sync.
 *
 * @returns {Promise<SyncLog|null>}
 */
export async function fetchLastSyncGames() {
  return apiFetch("/games/last-sync");
}

// ─── Sales CRUD ───────────────────────────────────────────────────────────────

/**
 * Ambil list sales dengan pagination, search, filter, dan sort.
 *
 * @param {Object} params
 * @param {number}  [params.page=1]
 * @param {number}  [params.pageSize=20]
 * @param {string}  [params.search]      - search by nama game
 * @param {string}  [params.genre]       - filter by genre
 * @param {string}  [params.sortBy]      - "our_price" | "updated_at" | "created_at" | "game_name" | "genre"
 * @param {string}  [params.sortDir]     - "asc" | "desc"
 * @returns {Promise<{ total: number, page: number, page_size: number, data: Sale[] }>}
 */
export async function fetchSales({
  page = 1,
  pageSize = 20,
  search,
  genre,
  sortBy = "updated_at",
  sortDir = "desc",
} = {}) {
  const qs = new URLSearchParams({
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_dir: sortDir,
  });
  if (search) qs.set("search", search);
  if (genre) qs.set("genre", genre);

  return apiFetch(`/sales?${qs.toString()}`);
}

/**
 * Ambil satu sale berdasarkan ID.
 *
 * @param {number} saleId
 * @returns {Promise<Sale>}
 */
export async function fetchSaleById(saleId) {
  return apiFetch(`/sales/${saleId}`);
}

/**
 * Buat sale baru.
 *
 * @param {{ game_id: number, our_price: number }} payload
 * @returns {Promise<Sale>}
 */
export async function createSale(payload) {
  return apiFetch("/sales", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update sale (partial — hanya field yang diisi yang dikirim).
 *
 * @param {number} saleId
 * @param {{ game_id?: number, our_price?: number }} payload
 * @returns {Promise<Sale>}
 */
export async function updateSale(saleId, payload) {
  return apiFetch(`/sales/${saleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Hapus sale berdasarkan ID.
 *
 * @param {number} saleId
 * @returns {Promise<null>}
 */
export async function deleteSale(saleId) {
  return apiFetch(`/sales/${saleId}`, { method: "DELETE" });
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

/**
 * Trigger sinkronisasi game dari RAWG + CheapShark (async via Celery).
 * Mengembalikan task_id untuk di-poll ke `pollSyncStatus`.
 *
 * @param {number} [limit=40] - jumlah game yang di-fetch (max 40)
 * @returns {Promise<{ task_id: string, status: string, message: string }>}
 */
export async function triggerSync(limit = 40) {
  return apiFetch(`/sync/games?limit=${limit}`, { method: "POST" });
}

/**
 * Cek progres task sync berdasarkan task_id.
 *
 * State yang mungkin: PENDING | STARTED | PROGRESS | SUCCESS | FAILURE
 *
 * @param {string} taskId
 * @returns {Promise<SyncStatus>}
 */
export async function pollSyncStatus(taskId) {
  return apiFetch(`/sync/status/${taskId}`);
}

/**
 * Ambil log sync terakhir dari database.
 *
 * @returns {Promise<SyncLog|null>}
 */
export async function fetchLastSync() {
  return apiFetch("/sync/last");
}

// ─── Sync dengan polling otomatis ─────────────────────────────────────────────

/**
 * Jalankan sync + polling otomatis sampai selesai atau gagal.
 *
 * Cocok untuk diikat ke tombol "Sync Data" di MainPage.
 *
 * @param {Object}   options
 * @param {number}   [options.limit=40]          - jumlah game
 * @param {number}   [options.intervalMs=1500]   - interval polling (ms)
 * @param {Function} [options.onProgress]        - callback(status) tiap poll
 * @param {Function} [options.onSuccess]         - callback(result) saat selesai
 * @param {Function} [options.onError]           - callback(error) saat gagal
 * @returns {Promise<void>}
 *
 * @example
 * await syncWithPolling({
 *   onProgress: (s) => console.log(s.progress.percent + "%"),
 *   onSuccess:  (r) => setLastSync(new Date().toLocaleString("id-ID")),
 *   onError:    (e) => alert(e.message),
 * });
 */
export async function syncWithPolling({
  limit = 40,
  intervalMs = 1500,
  onProgress,
  onSuccess,
  onError,
} = {}) {
  let taskId;

  try {
    const triggered = await triggerSync(limit);
    taskId = triggered.task_id;
  } catch (err) {
    onError?.(err);
    return;
  }

  return new Promise((resolve) => {
    const timer = setInterval(async () => {
      try {
        const status = await pollSyncStatus(taskId);
        onProgress?.(status);

        if (status.state === "SUCCESS") {
          clearInterval(timer);
          onSuccess?.(status);
          resolve();
        } else if (status.state === "FAILURE") {
          clearInterval(timer);
          onError?.(new Error(status.message ?? "Sync gagal"));
          resolve();
        }
      } catch (err) {
        clearInterval(timer);
        onError?.(err);
        resolve();
      }
    }, intervalMs);
  });
}

/**
 * Trigger sinkronisasi SEMUA game dari RAWG (loop pagination, tanpa limit).
 * Gunakan pollSyncStatus untuk memantau progress-nya.
 *
 * @returns {Promise<{ task_id: string, status: string, message: string }>}
 */
export async function triggerSyncAll() {
  return apiFetch("/sync/games/all", { method: "POST" });
}

/**
 * Sync semua game + polling otomatis sampai selesai.
 */
export async function syncAllWithPolling({
  intervalMs = 1500,
  onProgress,
  onSuccess,
  onError,
} = {}) {
  let taskId;
  try {
    const triggered = await triggerSyncAll();
    taskId = triggered.task_id;
  } catch (err) {
    onError?.(err);
    return;
  }

  return new Promise((resolve) => {
    const timer = setInterval(async () => {
      try {
        const status = await pollSyncStatus(taskId);
        onProgress?.(status);
        if (status.state === "SUCCESS") {
          clearInterval(timer);
          onSuccess?.(status);
          resolve();
        } else if (status.state === "FAILURE") {
          clearInterval(timer);
          onError?.(new Error(status.message ?? "Sync all gagal"));
          resolve();
        }
      } catch (err) {
        clearInterval(timer);
        onError?.(err);
        resolve();
      }
    }, intervalMs);
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * Helper: bangun query string date range.
 * @param {string} dateFrom - format "YYYY-MM-DD"
 * @param {string} dateTo   - format "YYYY-MM-DD"
 * @returns {string} - "?date_from=...&date_to=..."
 */
function buildDateParams(dateFrom, dateTo) {
  return `?date_from=${dateFrom}&date_to=${dateTo}`;
}

/**
 * Ambil ringkasan data untuk summary cards.
 * Tidak memiliki filter tanggal di BE saat ini.
 *
 * @returns {Promise<{
 *   total_games: number,
 *   total_sales: number,
 *   avg_global_price: number,
 *   avg_our_price: number
 * }>}
 */
export async function fetchDashboardSummary() {
  return apiFetch("/dashboard/summary");
}

/**
 * Ambil kisaran harga global per genre (untuk Pie chart & analitik avg price).
 * Difilter berdasarkan game.released.
 *
 * @param {string} dateFrom - "YYYY-MM-DD"
 * @param {string} dateTo   - "YYYY-MM-DD"
 * @returns {Promise<PriceRangeByGenre[]>}
 */
export async function fetchPriceRangeByGenre(dateFrom, dateTo) {
  return apiFetch(`/dashboard/price-range-by-genre${buildDateParams(dateFrom, dateTo)}`);
}

/**
 * Ambil jumlah game per tanggal last_updated (untuk Column chart Data Public).
 *
 * @param {string} dateFrom - "YYYY-MM-DD"
 * @param {string} dateTo   - "YYYY-MM-DD"
 * @returns {Promise<{ date: string, count: number }[]>}
 */
export async function fetchGamesByDate(dateFrom, dateTo) {
  return apiFetch(`/dashboard/games-by-date${buildDateParams(dateFrom, dateTo)}`);
}

/**
 * Ambil rata-rata rating per genre (untuk analitik tambahan Data Public).
 *
 * @param {string} dateFrom - "YYYY-MM-DD"
 * @param {string} dateTo   - "YYYY-MM-DD"
 * @returns {Promise<{ genre: string, avg_rating: number, game_count: number }[]>}
 */
export async function fetchAvgRatingByGenre(dateFrom, dateTo) {
  return apiFetch(`/dashboard/avg-rating-by-genre${buildDateParams(dateFrom, dateTo)}`);
}

/**
 * Ambil selisih harga toko vs global per genre (untuk Pie chart Data Sales).
 *
 * @param {string} dateFrom - "YYYY-MM-DD"
 * @param {string} dateTo   - "YYYY-MM-DD"
 * @returns {Promise<PriceGapByGenre[]>}
 */
export async function fetchPriceGapByGenre(dateFrom, dateTo) {
  return apiFetch(`/dashboard/price-gap-by-genre${buildDateParams(dateFrom, dateTo)}`);
}

/**
 * Ambil jumlah sales per tanggal (untuk Column chart 1 Data Sales).
 *
 * @param {string} dateFrom - "YYYY-MM-DD"
 * @param {string} dateTo   - "YYYY-MM-DD"
 * @returns {Promise<{ date: string, count: number }[]>}
 */
export async function fetchSalesByDate(dateFrom, dateTo) {
  return apiFetch(`/dashboard/sales-by-date${buildDateParams(dateFrom, dateTo)}`);
}

/**
 * Ambil MAX our_price per tanggal (untuk Line chart Data Sales).
 * Jika ada 2 game ditambahkan dalam 1 hari, hanya harga tertinggi yang tampil.
 *
 * @param {string} dateFrom - "YYYY-MM-DD"
 * @param {string} dateTo   - "YYYY-MM-DD"
 * @returns {Promise<{ date: string, max_price: number }[]>}
 */
export async function fetchMaxPriceByDate(dateFrom, dateTo) {
  return apiFetch(`/dashboard/max-price-by-date${buildDateParams(dateFrom, dateTo)}`);
}

// ─── JSDoc Types (referensi) ──────────────────────────────────────────────────

/**
 * @typedef {Object} Sale
 * @property {number}      id
 * @property {number}      game_id
 * @property {number}      our_price       - harga jual toko sendiri (USD)
 * @property {string|null} game_name
 * @property {string|null} game_genre
 * @property {number|null} price_cheap     - harga deal termurah (CheapShark)
 * @property {number|null} price_external  - harga normal Steam
 * @property {string|null} created_at
 * @property {string|null} updated_at
 */

/**
 * @typedef {Object} SyncStatus
 * @property {string} task_id
 * @property {string} state             - PENDING | STARTED | PROGRESS | SUCCESS | FAILURE
 * @property {{ current: number, total: number, percent: number }} progress
 * @property {number} [inserted]
 * @property {number} [updated]
 * @property {number} [skipped]
 * @property {string} [message]
 */

/**
 * @typedef {Object} SyncLog
 * @property {number} id
 * @property {string} source
 * @property {string} status
 * @property {string} synced_at
 * @property {number} [inserted]
 * @property {number} [updated]
 * @property {number} [skipped]
 * @property {string} [message]
 */

/**
 * @typedef {Object} PriceRangeByGenre
 * @property {string} genre
 * @property {number} min_price
 * @property {number} max_price
 * @property {number} avg_price
 * @property {number} game_count
 */

/**
 * @typedef {Object} PriceGapByGenre
 * @property {string}      genre
 * @property {number}      avg_our_price
 * @property {number}      avg_global_price
 * @property {number}      avg_gap
 * @property {number|null} gap_percent
 */