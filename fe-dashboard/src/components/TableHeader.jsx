import PropTypes from "prop-types";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

function TableHeader({ key, label, filterNode, ...restProps }) {
  const { sortKey, col, sortDir, handleSort } = restProps;

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
          onClick={() => handleSort(key)}
          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 select-none"
        >
          {label}
          <SortIcon col={key} />
        </button>
        {filterNode}
      </div>
    </th>
  );
}

TableHeader.propTypes = {
  key: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  handleSort: PropTypes.func.isRequired,
  col: PropTypes.string.isRequired,
  filterNode: PropTypes.node,
  sortKey: PropTypes.string,
  sortDir: PropTypes.string,
};

export default TableHeader;