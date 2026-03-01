import { useState } from "react";
import { FaSync, FaChevronDown } from "react-icons/fa";
import PropTypes from "prop-types";
import { getSyncCurrentPage, resetSyncPage } from "../../utils/network-data";

const SYNC_OPTIONS = [
  { label: "Sync 10 Game", value: 10 },
  { label: "Sync 20 Game", value: 20 },
  { label: "Sync 40 Game", value: 40 },
];

function SyncDataButton({ lastSync, onClick, isSyncing }) {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState(40);
  const currentPage = getSyncCurrentPage();

  const handleSelect = (limit) => {
    setSelectedLimit(limit);
    setShowMenu(false);
    onClick(limit);
  };

  return (
    <div className="flex items-center gap-3">
      {lastSync && (
        <span className="text-xs text-gray-400">Last sync: {lastSync}</span>
      )}
      {/* Info page berikutnya */}
      <span className="text-xs text-gray-400">Page {currentPage}</span>

      <div className="relative">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
          <button
            onClick={() => onClick(selectedLimit)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-60"
          >
            <FaSync className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : `Sync ${selectedLimit} Game`}
          </button>
          <button
            onClick={() => setShowMenu((o) => !o)}
            disabled={isSyncing}
            className="px-2 py-2 text-blue-400 hover:bg-blue-50 border-l border-gray-200 transition-colors disabled:opacity-60"
          >
            <FaChevronDown size={11} />
          </button>
        </div>

        {showMenu && (
          <div className="absolute right-0 top-11 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-44 overflow-hidden">
            {SYNC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  selectedLimit === opt.value
                    ? "text-blue-600 font-medium bg-blue-50"
                    : "text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <div className="border-t border-gray-100" />
            {/* Reset page ke 1 */}
            <button
              onClick={() => {
                resetSyncPage();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-50 transition-colors"
            >
              Reset ke Page 1
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

SyncDataButton.propTypes = {
  lastSync: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  isSyncing: PropTypes.bool.isRequired,
};

export default SyncDataButton;
