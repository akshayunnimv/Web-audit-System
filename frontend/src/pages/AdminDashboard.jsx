import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHome from "../components/AdminHome";
import AdminIssuePolicy from "../components/AdminIssuePolicy";
import AdminUsers from "../components/AdminUsers";
import AdminStatistics from "../components/AdminStatistics";
import AdminReview from "../components/AdminReview";
import "./AdminDashboard.css"; // optional styling

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-main-content">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="issuepolicy" element={<AdminIssuePolicy />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="statistics" element={<AdminStatistics />} />
          <Route path="review" element={<AdminReview />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
