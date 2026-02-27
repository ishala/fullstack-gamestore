import { FaFilter, FaTimes } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

function FilterPopover({ active, onClear, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef();
  const popoverRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX - 80, // geser ke kiri agar tidak keluar layar
      });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`p-1 rounded transition-colors ${
          active
            ? "text-blue-500 bg-blue-50"
            : "text-gray-300 hover:text-gray-500"
        }`}
      >
        <FaFilter size={10} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
          }}
          className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-52"
        >
          {children}
          {active && (
            <button
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              <FaTimes size={10} /> Hapus Filter
            </button>
          )}
        </div>
      )}
    </>
  );
}

FilterPopover.propTypes = {
  active: PropTypes.bool,
  onClear: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default FilterPopover;
