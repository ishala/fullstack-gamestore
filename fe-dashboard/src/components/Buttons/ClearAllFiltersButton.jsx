import { FaTimes } from "react-icons/fa";
import PropTypes from "prop-types";

function ClearAllFiltersButton({ onClick, activeFilterCount }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
    >
      <FaTimes size={10} /> Hapus semua filter ({activeFilterCount})
    </button>
  );
}

ClearAllFiltersButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  activeFilterCount: PropTypes.number,
};

export default ClearAllFiltersButton;
