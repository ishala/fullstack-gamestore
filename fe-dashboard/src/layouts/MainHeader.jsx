import SearchField from "../components/SearchField";
import ClearAllFiltersButton from "../components/Buttons/ClearAllFiltersButton";
import SyncDataButton from "../components/Buttons/SyncDataButton";
import PropTypes from "prop-types";

function MainHeader({ search, setSearch, ...restProps }) {
  const { activeFilterCount, clearAllFilters, lastSync, handleSync, syncing } =
    restProps;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      {/* Search */}
      <SearchField value={search} onChange={setSearch} placeholder="Search game, platforms..." />

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <ClearAllFiltersButton
          onClick={clearAllFilters}
          activeFilterCount={activeFilterCount}
        />
      )}

      {/* Right Actions */}
      <SyncDataButton
        lastSync={lastSync}
        onClick={handleSync}
        isSyncing={syncing}
      />
    </div>
  );
}

MainHeader.propTypes = {
  search: PropTypes.string,
  setSearch: PropTypes.func.isRequired,
  activeFilterCount: PropTypes.number,
  clearAllFilters: PropTypes.func.isRequired,
  lastSync: PropTypes.string,
  handleSync: PropTypes.func.isRequired,
  syncing: PropTypes.bool.isRequired,
};

export default MainHeader;
