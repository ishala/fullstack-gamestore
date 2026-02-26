import { FaSearch } from "react-icons/fa";
import PropTypes from "prop-types";

function SearchField({value, onChange}) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-72 shadow-sm">
      <FaSearch className="text-gray-400 text-sm" />
      <input
        type="text"
        placeholder="Cari game, genre, platform..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="outline-none text-sm text-gray-700 w-full bg-transparent"
      />
    </div>
  );
}

SearchField.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
}

export default SearchField;