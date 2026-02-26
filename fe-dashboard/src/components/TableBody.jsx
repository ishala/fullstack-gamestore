import PropTypes from "prop-types";
import { EditButton, DeleteButton } from "./Buttons/ActionButtons";

const RatingBadge = ({ value }) => {
  const color =
    value >= 9
      ? "text-emerald-600"
      : value >= 7
        ? "text-yellow-500"
        : "text-red-500";
  return (
    <span className={`font-bold text-sm ${color}`}>★ {value.toFixed(1)}</span>
  );
};

function TableBody({ filteredData, handleDelete }) {
  return (
    <tbody className="divide-y divide-gray-100">
      {filteredData.length === 0 ? (
        <tr>
          <td colSpan={8} className="text-center py-12 text-gray-400">
            Tidak ada data ditemukan.
          </td>
        </tr>
      ) : (
        filteredData.map((game, idx) => (
          <tr key={game.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
            <td className="px-4 py-3">
              <span className="font-medium text-gray-800">{game.name}</span>
            </td>
            <td className="px-4 py-3">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium">
                {game.genre}
              </span>
            </td>
            <td className="px-4 py-3 text-gray-600">{game.releaseDate}</td>
            <td className="px-4 py-3 text-gray-600 text-xs">{game.platform}</td>
            <td className="px-4 py-3">
              <span className="font-semibold text-emerald-600">
                {game.cheapest}
              </span>
            </td>
            <td className="px-4 py-3">
              <RatingBadge value={game.rating} />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                <EditButton />
                <DeleteButton handleDelete={handleDelete} gameId={Number(game.id)} />
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
};

RatingBadge.propTypes = {
  value: PropTypes.number,
};

export default TableBody;
