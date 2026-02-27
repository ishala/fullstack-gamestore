import PropTypes from "prop-types";

const RatingBadge = ({ value }) => {
  if (value == null) {
    return <span className="text-xs text-gray-300">N/A</span>;
  }
  const color =
    value >= 4
      ? "text-emerald-600"
      : value >= 3.5
        ? "text-yellow-500"
        : "text-red-500";
  return (
    <span className={`font-bold text-sm ${color}`}>★ {value.toFixed(1)}</span>
  );
};

RatingBadge.propTypes = {
    value: PropTypes.number
}

export default RatingBadge;