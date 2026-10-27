import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar/Sidebar.jsx";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-layout__content">
        {/*
          Outlet es el lugar donde React Router
          dibuja TopicsPage, ExercisePage o ProgressPage.
        */}
        <Outlet />
      </main>
    </div>
  );
}
