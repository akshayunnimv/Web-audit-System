import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-sidebar">
      <h2 className="admin-app-name">Site Intel</h2>
      <ul>
        <li
          className={location.pathname === "/admin-dashboard" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard")}
        >
          🏠 Home
        </li>
        <li
          className={location.pathname === "/admin-dashboard/issuepolicy" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard/issuepolicy")}
        >
          📜 Issue Policy
        </li>
        <li
          className={location.pathname === "/admin-dashboard/users" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard/users")}
        >
          👤 Users
        </li>
        <li
          className={location.pathname === "/admin-dashboard/statistics" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard/statistics")}
        >
          📊 Statistics
        </li>
        <li
          className={location.pathname === "/admin-dashboard/review" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard/review")}
        >
          📝 Feedbacks
        </li>
        <li onClick={() => handleNavigate("/admin-login")}>🔒 Logout</li>
      </ul>
    </div>
  );
};

export default AdminSidebar;
