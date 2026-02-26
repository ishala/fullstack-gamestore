import { FaSync } from "react-icons/fa";
import PropTypes from "prop-types";

function SyncDataButton({ lastSync, onClick, isSyncing }) {
  return (
    <div className="flex items-center gap-3">
      {lastSync && (
        <span className="text-xs text-gray-400">Last sync: {lastSync}</span>
      )}
      <button
        onClick={onClick}
        disabled={isSyncing}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-gray-200 rounded-lg bg-white hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-60"
      >
        <FaSync className={isSyncing ? "animate-spin" : ""} />
        {isSyncing ? "Syncing..." : "Sync Data"}
      </button>
    </div>
  );
}

SyncDataButton.propTypes = {
  lastSync: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  isSyncing: PropTypes.bool.isRequired,
};

export default SyncDataButton;
