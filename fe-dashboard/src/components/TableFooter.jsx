import Pagination from "./Pagination";
import PropTypes from "prop-types";

function TableFooter({
  filteredData,
  currentPage,
  pageSize,
  totalPages,
  goToPage,
  getPageNumbers,
}) {
  const dataLength = filteredData.length;
  const firstCountDataShowed =
    dataLength === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const secondCountDataShowed = Math.min(currentPage * pageSize, dataLength);

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
      <span className="text-xs text-gray-400">
        Show {firstCountDataShowed}–{secondCountDataShowed} from {dataLength}{" "}
        data
      </span>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        goToPage={goToPage}
        getPageNumbers={getPageNumbers}
        totalData={dataLength}
        PAGE_SIZE={pageSize}
      />
    </div>
  );
}

TableFooter.propTypes = {
  filteredData: PropTypes.array.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  goToPage: PropTypes.func.isRequired,
  getPageNumbers: PropTypes.func.isRequired,
  PAGE_SIZE: PropTypes.number.isRequired,
};

export default TableFooter;
