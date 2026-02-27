import PropTypes from "prop-types";
import { EditButton, DeleteButton } from "./Buttons/ActionButtons";
import RatingBadge from "./RatingBadge";
import dayjs from "dayjs";

const DEFAULT_FIELD_MAP = {
  name: "name",
  genre: "genre",
  released: "released",
  rating: "rating",
};

const ALL_COLUMNS = ["name", "genre", "released", "price", "rating"];

function TableBody({
  filteredData,
  handleDelete,
  priceKey = "price_cheap",
  fieldMap = {},
  columns,
  editingId,
  editPrice,
  setEditPrice,
  onEditStart,
  onEditSave,
  onEditCancel
}) {
  const fields = { ...DEFAULT_FIELD_MAP, ...fieldMap };
  const visibleCols = columns ?? ALL_COLUMNS;
  // colSpan = no. + kolom visible + action
  const colSpan = 1 + visibleCols.length + 1;

  const formatPrice = (val) =>
    val != null ? `$${Number(val).toFixed(2)}` : "-";

  const formatDate = (val) => {
    if (!val) return "-";
    return dayjs(val).format("DD MMM YYYY");
  };

  return (
    <tbody className="divide-y divide-gray-100">
      {filteredData.length === 0 ? (
        <tr>
          <td colSpan={colSpan} className="text-center py-12 text-gray-400">
            Tidak ada data ditemukan.
          </td>
        </tr>
      ) : (
        filteredData.map((game, idx) => (
          <tr key={game.id} className="hover:bg-gray-50 transition-colors">
            {/* No. */}
            <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>

            {/* Nama Game */}
            {visibleCols.includes("name") && (
              <td className="px-4 py-3">
                <span className="font-medium text-gray-800">
                  {game[fields.name] ?? "-"}
                </span>
              </td>
            )}

            {/* Genre */}
            {visibleCols.includes("genre") && (
              <td className="px-4 py-3">
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-md">
                  {game[fields.genre] ?? "-"}
                </span>
              </td>
            )}

            {/* Release Date */}
            {visibleCols.includes("released") && (
              <td className="px-4 py-3 text-gray-600">
                {formatDate(game[fields.released])}
              </td>
            )}

            {/* Harga */}
            {visibleCols.includes("price") && (
              <td className="px-4 py-3">
                {editingId === game.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-sm font-bold">$</span>
                    <input
                      type="text"
                      value={editPrice}
                      onChange={(e) =>
                        setEditPrice(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      className="w-24 px-2 py-1 text-sm border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                ) : (
                  <span className="font-semibold text-emerald-600">
                    {formatPrice(game[priceKey])}
                  </span>
                )}
              </td>
            )}

            {/* Rating */}
            {visibleCols.includes("rating") && (
              <td className="px-4 py-3">
                <RatingBadge value={game[fields.rating]} />
              </td>
            )}

            {/* Actions */}
            <td className="px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                {priceKey !== "price_cheap" && editingId === game.id ? (
                  <>
                    <button
                      onClick={() => onEditSave(game.id)}
                      className="text-green-500 hover:text-green-700 hover:bg-green-50 p-1.5 rounded-lg transition-colors text-sm font-bold"
                      title="Simpan"
                    >
                      ✓
                    </button>
                    <button
                      onClick={onEditCancel}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1.5 rounded-lg transition-colors text-sm font-bold"
                      title="Batal"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    {priceKey !== "price_cheap" && (
                      <EditButton onClick={() => onEditStart(game)} />
                    )}
                    <DeleteButton
                      handleDelete={handleDelete}
                      gameId={Number(game.id)}
                    />
                  </>
                )}
              </div>
            </td>
          </tr>
        ))
      )}
    </tbody>
  );
}

TableBody.propTypes = {
  filteredData: PropTypes.arrayOf(PropTypes.object),
  handleDelete: PropTypes.func.isRequired,
  priceKey: PropTypes.string.isRequired,
  fieldMap: PropTypes.shape({
    name: PropTypes.string,
    genre: PropTypes.string,
    released: PropTypes.string,
    rating: PropTypes.string,
  }),
  columns: PropTypes.arrayOf(
    PropTypes.oneOf(["name", "genre", "released", "price", "rating"]),
  ),
  editingId: PropTypes.number,
  editPrice: PropTypes.string,
  setEditPrice: PropTypes.func,
  onEditStart: PropTypes.func,
  onEditSave: PropTypes.func,
  onEditCancel: PropTypes.func,
};

export default TableBody;
