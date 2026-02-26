import FilterPopover from "./FilterPopover";
import PropTypes from "prop-types";

function DateFilter({ value, onChange, onClear }) {
  return (
    <FilterPopover active={!!(value.from || value.to)} onClear={onClear}>
      <p className="text-xs font-semibold text-gray-500 mb-2">Release Date</p>
      <div className="flex flex-col gap-2">
        <div>
          <label className="text-xs text-gray-400">Dari</label>
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="w-full mt-0.5 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Sampai</label>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="w-full mt-0.5 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
          />
        </div>
      </div>
    </FilterPopover>
  );
}

DateFilter.propTypes = {
    value: PropTypes.shape({
        from: PropTypes.string,
        to: PropTypes.string}).isRequired,
    onChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired
}

export default DateFilter;