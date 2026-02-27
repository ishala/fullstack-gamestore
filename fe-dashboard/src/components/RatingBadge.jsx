import PropTypes from "prop-types";

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

RatingBadge.propTypes = {
    value: PropTypes.number
}

export default RatingBadge;