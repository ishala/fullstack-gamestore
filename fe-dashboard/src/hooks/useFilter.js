import { useState } from "react";

export function useFilter(data) {
  const [filterGenre, setFilterGenre] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterRating, setFilterRating] = useState({ min: "", max: "" });
  const [filterPrice, setFilterPrice] = useState({ min: "", max: "" });
  const [filterDate, setFilterDate] = useState({ from: "", to: "" });

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

  const applyFiltering = (search = "") =>
    data.filter(
      (g) =>
        (!search || g.name.toLowerCase().includes(search.toLowerCase())) &&
        (!filterGenre || g.genre === filterGenre) &&
        (!filterPlatform || g.platform === filterPlatform) &&
        (!filterRating.min || g.rating >= parseFloat(filterRating.min)) &&
        (!filterRating.max || g.rating <= parseFloat(filterRating.max)) &&
        (!filterPrice.min || g.cheapest >= parseFloat(filterPrice.min)) &&
        (!filterPrice.max || g.cheapest <= parseFloat(filterPrice.max)) &&
        (!filterDate.from || g.releaseDate >= filterDate.from) &&
        (!filterDate.to || g.releaseDate <= filterDate.to),
    );

  return {
    filterGenre, setFilterGenre,
    filterPlatform, setFilterPlatform,
    filterRating, setFilterRating,
    filterPrice, setFilterPrice,
    filterDate, setFilterDate,
    activeFilterCount,
    clearAllFilters,
    applyFiltering,
  };
}