import PropTypes from "prop-types";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

function TableHeader({ col, label, filterNode, sortKey, sortDir, handleSort }) {
  const SortIcon = () => {
    if (sortKey !== col) return <FaSort className="text-gray-300" />;
    return sortDir === "asc" ? (
      <FaSortUp className="text-blue-500" />
    ) : (
      <FaSortDown className="text-blue-500" />
    );
  };

  return (
    <th className="px-4 py-3 text-left">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleSort(col)}
          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 select-none"
        >
          {label}
          <SortIcon />
        </button>
        {filterNode}
      </div>
    </th>
  );
}

TableHeader.propTypes = {
  col: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  handleSort: PropTypes.func.isRequired,
  filterNode: PropTypes.node,
  sortKey: PropTypes.string,
  sortDir: PropTypes.string,
};

export default TableHeader;