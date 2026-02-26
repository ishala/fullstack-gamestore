import SelectFilter from "./components/Filters/SelectFilter";
import DateFilter from "./components/Filters/DateFilter";
import RangeFilter from "./components/Filters/RangeFilter";
import TableHeader from "./TableHeader";
import TableBody from "./TableBody";
import PropTypes from "prop-types";

function TableColumn({...allProps}) {
    const {sortKey, }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">
                #
              </th>
              <TableHeader />
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}
