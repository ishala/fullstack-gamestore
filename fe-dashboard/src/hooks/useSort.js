import { useState } from "react";

export function useSort(initialKey = "updatedAt", initialDir = "desc") {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDir, setSortDir] = useState(initialDir);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const applySorting = (data) => {
    if (!sortKey) return data; // ← tambah ini
    return [...data].sort((a, b) => {
      const valA = a[sortKey],
        valB = b[sortKey];
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  };

  return { sortKey, sortDir, handleSort, applySorting };
}
