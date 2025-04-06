import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseclient";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <h2 className="app-name">Site Intel</h2>
      <nav>
        <ul>
          <li
            className={location.pathname === "/dashboard" ? "active" : ""}
            onClick={() => navigate("/dashboard")}
          >
            🏠 Dashboard
          </li>
          <li
            className={location.pathname === "/dashboard/checkurl" ? "active" : ""}
            onClick={() => navigate("/dashboard/checkurl")}
          >
            🔍 Check URL
          </li>
          <li
            className={location.pathname === "/dashboard/feedback" ? "active" : ""}
            onClick={() => navigate("/dashboard/feedback")}
          >
            💬 Feedback
          </li>
          <li onClick={handleLogout} className="logout">🔒 Logout</li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;