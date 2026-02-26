import { FaFilter, FaTimes } from "react-icons/fa";
import {useState, useRef, useEffect} from "react";
import PropTypes from "prop-types";

function FilterPopover({ active, onClear, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`p-1 rounded transition-colors ${active ? "text-blue-500 bg-blue-50" : "text-gray-300 hover:text-gray-500"}`}
      >
        <FaFilter size={10} />
      </button>
      {open && (
        <div className="absolute z-50 top-7 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-52">
          {children}
          {active && (
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              <FaTimes size={10} /> Hapus Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

FilterPopover.propTypes = {
    active: PropTypes.bool,
    onClear: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
}

export default FilterPopover;