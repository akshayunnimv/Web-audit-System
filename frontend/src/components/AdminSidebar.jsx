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
      <h2 className="admin-app-name">SITE INTEL</h2>
      <ul>
        <li
          className={location.pathname === "/admin-dashboard" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard")}
        >
          <img className="side-icon" src="/home.png"></img> Home
        </li>
        <li
          className={location.pathname === "/admin-dashboard/issuepolicy" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard/issuepolicy")}
        >
          <img className="side-icon" src="/icons/contract.png"></img> Issue Policy
        </li>
        <li
          className={location.pathname === "/admin-dashboard/users" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard/users")}
        >
          <img className="side-icon" src="/icons/user.png"></img> Users
        </li>
        <li
          className={location.pathname === "/admin-dashboard/reports" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard/reports")}
        >
          <img className="side-icon" src="/history.png"></img> Reports
        </li>
        <li
          className={location.pathname === "/admin-dashboard/statistics" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard/statistics")}
        >
           <img className="side-icon" src="/bar-chart.png"></img> Statistics
        </li>
        <li
          className={location.pathname === "/admin-dashboard/review" ? "active" : ""}
          onClick={() => handleNavigate("/admin-dashboard/review")}
        >
         <img className="side-icon" src="/feedback.png"></img>Feedbacks
        </li>
        <li onClick={() => handleNavigate("/admin-login")}><img className="side-icon" src="/log-out.png"></img> Logout</li>
      </ul>
    </div>
  );
};

export default AdminSidebar;
