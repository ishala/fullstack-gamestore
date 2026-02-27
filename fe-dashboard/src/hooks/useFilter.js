import { useState } from "react";

/**
 * useFilter — disesuaikan dengan field GameInDB dari /games:
 *   name, genre, price_cheap, rating, released
 *
 * Filter genre & search dikirim ke server via fetchGames().
 * Filter rating, price, date dilakukan di client-side.
 */
export function useFilter(data) {
  const [filterGenre, setFilterGenre] = useState("");
  const [filterRating, setFilterRating] = useState({ min: "", max: "" });
  const [filterPrice, setFilterPrice] = useState({ min: "", max: "" });
  const [filterDate, setFilterDate] = useState({ from: "", to: "" });

  const activeFilterCount = [
    filterGenre,
    filterRating.min || filterRating.max,
    filterPrice.min || filterPrice.max,
    filterDate.from || filterDate.to,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterGenre("");
    setFilterRating({ min: "", max: "" });
    setFilterPrice({ min: "", max: "" });
    setFilterDate({ from: "", to: "" });
  };

  /**
   * Filter client-side pada data yang sudah di-fetch dari server.
   * Genre sudah difilter server, tidak diulang di sini.
   *
   * @param {string} search
   */
  const applyFiltering = (search = "") =>
    data.filter((g) => {
      // Search nama game (client-side fallback)
      if (search && !g.name?.toLowerCase().includes(search.toLowerCase()))
        return false;

      // Filter rating
      if (filterRating.min && (g.rating ?? 0) < parseFloat(filterRating.min))
        return false;
      if (filterRating.max && (g.rating ?? 0) > parseFloat(filterRating.max))
        return false;

      // Filter harga global (price_cheap)
      if (filterPrice.min && (g.price_cheap ?? 0) < parseFloat(filterPrice.min))
        return false;
      if (filterPrice.max && (g.price_cheap ?? 0) > parseFloat(filterPrice.max))
        return false;

      // Filter tanggal rilis
      if (filterDate.from) {
        const released = g.released ? g.released.slice(0, 10) : "";
        if (!released || released < filterDate.from) return false;
      }
      if (filterDate.to) {
        const released = g.released ? g.released.slice(0, 10) : "";
        if (!released || released > filterDate.to) return false;
      }

      return true;
    });

  return {
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
  };
}