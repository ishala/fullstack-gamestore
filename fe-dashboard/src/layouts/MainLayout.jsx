import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function MainLayout() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "auto", backgroundColor: "#f5f5f5" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;