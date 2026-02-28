import PropTypes from "prop-types";
import { fmt } from "../../utils";

function StatCard({ icon, label, color, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`text-2xl font-bold ${color}`}>{fmt(value)}</p>
      </div>
    </div>
  );
}

StatCard.propTypes = {
  icon:  PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  value: PropTypes.node,
};

export default StatCard;