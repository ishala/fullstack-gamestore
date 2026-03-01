import PropTypes from "prop-types";

function Pagination({
  currentPage,
  totalPages,
  goToPage,
  getPageNumbers,
  totalData,
  PAGE_SIZE,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
      <span className="text-xs text-gray-400">
        Menampilkan {totalData === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
        {Math.min(currentPage * PAGE_SIZE, totalData)} dari {totalData} data
      </span>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-xs rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ‹
        </button>

        {/* First page + ellipsis */}
        {getPageNumbers()[0] > 1 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className="px-2.5 py-1 text-xs rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100"
            >
              1
            </button>
            {getPageNumbers()[0] > 2 && (
              <span className="text-xs text-gray-400 px-1">…</span>
            )}
          </>
        )}

        {/* Page numbers */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              page === currentPage
                ? "bg-blue-500 border-blue-500 text-white"
                : "border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Last page + ellipsis */}
        {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
          <>
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
              <span className="text-xs text-gray-400 px-1">…</span>
            )}
            <button
              onClick={() => goToPage(totalPages)}
              className="px-2.5 py-1 text-xs rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-xs rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  goToPage: PropTypes.func.isRequired,
  getPageNumbers: PropTypes.func.isRequired,
  totalData: PropTypes.number.isRequired,
  PAGE_SIZE: PropTypes.number.isRequired,
};

export default Pagination;
