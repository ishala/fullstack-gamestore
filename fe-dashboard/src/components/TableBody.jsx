import PropTypes from "prop-types";
import { EditButton, DeleteButton } from "./Buttons/ActionButtons";
import RatingBadge from "./RatingBadge";
import dayjs from "dayjs";

function TableBody({ filteredData, handleDelete, priceKey = "price_cheap" }) {
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
          <td colSpan={7} className="text-center py-12 text-gray-400">
            Tidak ada data ditemukan.
          </td>
        </tr>
      ) : (
        filteredData.map((game, idx) => (
          <tr key={game.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
            <td className="px-4 py-3">
              <span className="font-medium text-gray-800">{game.name ?? "-"}</span>
            </td>
            <td className="px-4 py-3">
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-md">
                {game.genre ?? "-"}
              </span>
            </td>
            <td className="px-4 py-3 text-gray-600">
              {formatDate(game.released)}
            </td>
            <td className="px-4 py-3">
              <span className="font-semibold text-emerald-600">
                {formatPrice(game[priceKey])}
              </span>
              {/* {game.price_external != null && (
                <span className="ml-1.5 text-xs text-gray-400 line-through">
                  {formatPrice(game.price_external)}
                </span>
              )} */}
            </td>
            <td className="px-4 py-3">
              <RatingBadge value={game.rating} />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                <EditButton />
                <DeleteButton
                  handleDelete={handleDelete}
                  gameId={Number(game.id)}
                />
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
};

export default TableBody;