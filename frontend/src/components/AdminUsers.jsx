import React, { useEffect, useState } from "react";
import "./adminusers.css";
import { supabase } from "../supabaseclient";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("tbl_user").select("*");
    if (data) setUsers(data);
  };

  const fetchLogs = async (userId) => {
    const { data, error } = await supabase
      .from("tbl_log")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });
    if (data) setLogs(data);
  };

  const openSlide = (user) => {
    setSelectedUser(user);
    fetchLogs(user.id);
    document.getElementById("activityPanel").style.width = "400px";
  };

  const closeSlide = () => {
    document.getElementById("activityPanel").style.width = "0";
    setSelectedUser(null);
    setLogs([]);
  };

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = users.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div className="admin-content">
      <h2>Users</h2>
      <div className="user-card-grid">
        {currentUsers.map((user, index) => (
          <div className="user-card" key={index}>
            <img
              src={user.profile_picture || "/default-image.png"}
              alt="Profile"
              className="profile-pic"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-image.png"; // Add a default in your public folder
              }}
            />
            <div className="user-details">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Phone:</strong> {user.phone}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Last Login:</strong> {new Date(user.last_login).toLocaleString()}</p>
            </div>
            <button onClick={() => openSlide(user)}>View Activity</button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination-user">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={currentPage === i + 1 ? "active" : ""}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Activity Slide Panel */}
      <div id="activityPanel" className="activity-slide">
        <button className="closebtn" onClick={closeSlide}>&times;</button>
        <h3>Activity Log: {selectedUser?.name}</h3>
        <ul>
          {logs.length === 0 ? (
            <li>No logs found</li>
          ) : (
            logs.map((log, idx) => (
              <li key={idx}>
                <strong>{new Date(log.timestamp).toLocaleString()}</strong><br />
                {log.activity}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default AdminUsers;
