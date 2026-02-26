import PropTypes from "prop-types";
import FilterPopover from "./FilterPopover";

function SelectFilter({ label, options, value, onChange, onClear }) {
  return (
    <FilterPopover active={!!value} onClear={onClear}>
      <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${
              value === opt ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-50 text-gray-600"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </FilterPopover>
  );
}

SelectFilter.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired
}

export default SelectFilter;