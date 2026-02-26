import FilterPopover from "./FilterPopover";
import PropTypes from "prop-types";

function RangeFilter({ label,value, onChange, onClear, prefix = "" }) {
    let min = null
    let max = null
    if(value.min) min = value.min
    if(value.max) max = value.max

  return (
    <FilterPopover active={!!(value.min || value.max)} onClear={onClear}>
      <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={`${min}`}
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
        />
        <span className="text-gray-300 text-xs">–</span>
        <input
          type="number"
          placeholder={`${max}`}
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
        />
      </div>
      {prefix && <p className="text-xs text-gray-400 mt-1">{prefix}</p>}
    </FilterPopover>
  );
}

RangeFilter.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.shape({
        max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        min: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }),
    onChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    prefix: PropTypes.string
}

export default RangeFilter;