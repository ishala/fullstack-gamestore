import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import MainPage from "./pages/MainPage";
import MyStorePage from "./pages/MyStorePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<MainPage/>}/>
          <Route path="dashboard" element={<Dashboard/>}/>
          <Route path="my-store" element={<MyStorePage/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
