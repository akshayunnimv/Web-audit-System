import React, { useEffect, useState } from "react";
import "./adminusers.css";
import { supabase } from "../supabaseclient";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const usersPerPage = 6;
  const logsPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tbl_user").select("*");
    if (data) setUsers(data);
    setLoading(false);
  };

  const fetchLogs = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tbl_log")
      .select(`
        *,
        tbl_crawledurls (url)
      `)
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(logsPerPage);
    if (data) setLogs(data);
    setLoading(false);
  };

  const fetchAllLogsForExport = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tbl_log")
      .select(`
        *,
        tbl_crawledurls (url)
      `)
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });
    setLoading(false);
    return data || [];
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

  const handleExportCSV = async () => {
    if (!selectedUser) return;
    
    const allLogs = await fetchAllLogsForExport(selectedUser.id);
    if (!allLogs || allLogs.length === 0) {
      alert("No logs found for this user");
      return;
    }

    const rows = [["S.No", "Timestamp", "Action", "URL"]];
    allLogs.forEach((log, index) => {
      const url = log.tbl_crawledurls?.url || "N/A";
      const formattedTime = `"${new Date(log.timestamp).toLocaleString()}"`;
      rows.push([index + 1, formattedTime, log.action, url]);
    });

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = `${selectedUser.name}_activity_logs.csv`;
    a.click();
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(users.length / usersPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="pagination-user">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          &laquo;
        </button>
        {currentPage > 1 && (
          <button onClick={() => setCurrentPage(1)}>1</button>
        )}
        {currentPage > 2 && <span>...</span>}
        <button className="active">{currentPage}</button>
        {currentPage < totalPages - 1 && <span>...</span>}
        {currentPage < totalPages && (
          <button onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
          </button>
        )}
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          &raquo;
        </button>
      </div>
    );
  };

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = users.slice(indexOfFirst, indexOfLast);

  return (
    <div className="admin-content">
      <h2>Users</h2>
      
      {loading ? (
        <div className="loading-animation">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="user-card-grid">
            {currentUsers.map((user, index) => (
              <div className="user-card" key={index}>
                <img
                  src={user.profile_picture || "/default-image.png"}
                  alt="Profile"
                  className="profile-pic"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/default-image.png";
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

          {renderPagination()}
        </>
      )}

      {/* Activity Slide Panel */}
      <div id="activityPanel" className="activity-slide">
        <button className="closebtn" onClick={closeSlide}>&times;</button>
        <h3>Activity Log: {selectedUser?.name}</h3>
        <button 
          className="export-btn" 
          onClick={handleExportCSV}
          disabled={loading}
        >
          {loading ? "Preparing..." : "Download Full Activity Log"}
        </button>
        {loading ? (
          <div className="loading-animation">
            <div className="spinner"></div>
            <p>Loading logs...</p>
          </div>
        ) : (
          <ul>
            {logs.length === 0 ? (
              <li>No recent activity found</li>
            ) : (
              logs.map((log, idx) => (
                <li key={idx}>
                  <strong>{new Date(log.timestamp).toLocaleString()}</strong><br />
                  <strong>Action:</strong> {log.action}<br />
                  {log.tbl_crawledurls?.url && (
                    <>
                      <strong>URL:</strong> {log.tbl_crawledurls.url}
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;