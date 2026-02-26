import { NavLink } from "react-router-dom";
import { MdDashboard, MdSell } from "react-icons/md";
import { FaGamepad } from "react-icons/fa6";

const menuItems = [
  { path: "/", label: "Main Page", icon: <FaGamepad size={20} /> },
  { path: "/dashboard", label: "Dashboard", icon: <MdDashboard size={20} /> },
  { path: "/my-store", label: "My Store", icon: <MdSell size={20} /> },
];

function Sidebar() {
  return (
    <aside className="w-[220px] bg-[#1a1a2e] text-white flex flex-col py-5">
      <div className="px-5 pb-5 text-xl font-bold">Game Shop</div>
      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-5 py-3 no-underline border-l-[3px] transition-colors ${
                isActive
                  ? "text-white bg-[#0f3460] border-[#e94560]"
                  : "text-[#aaa] bg-transparent border-transparent"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
