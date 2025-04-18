import React, { useEffect, useState } from "react";
import "../pages/AdminDashboard.css";
import "./AdminIssuePolicy.css";
import { supabase } from "../supabaseclient";

const AdminIssuePolicy = () => {
  const [issuePolicies, setIssuePolicies] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({
    issue_name: "",
    description: "",
    recommendation: "",
    severity: "",
    type: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchIssuePolicies();
  }, []);

  const fetchIssuePolicies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tbl_issuepolicy")
      .select("*")
      .order("issue_id", { ascending: true });
    if (error) {
      console.error("Error fetching:", error);
    } else {
      setIssuePolicies(data);
    }
    setLoading(false);
  };

  const handleAddOrUpdate = async () => {
    const { issue_name, description, recommendation, severity, type } = formData;
    if (!issue_name || !description || !recommendation || !severity || !type) {
      return alert("Please fill all fields");
    }

    setLoading(true);
    if (selectedRow) {
      // Update
      const { error } = await supabase
        .from("tbl_issuepolicy")
        .update(formData)
        .eq("issue_id", selectedRow.issue_id);
      if (!error) {
        alert("Updated!");
        fetchIssuePolicies();
        resetForm();
      }
    } else {
      // Add
      const { error } = await supabase.from("tbl_issuepolicy").insert([formData]);
      if (!error) {
        alert("Added!");
        fetchIssuePolicies();
        resetForm();
      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedRow) return alert("No row selected.");
    
    // Add confirmation dialog
    const confirmDelete = window.confirm("Are you sure you want to delete this issue policy?");
    if (!confirmDelete) return; // Exit if user cancels
  
    setLoading(true);
    const { error } = await supabase
      .from("tbl_issuepolicy")
      .delete()
      .eq("issue_id", selectedRow.issue_id);
    
    if (!error) {
      alert("Deleted successfully!");
      fetchIssuePolicies();
      setSelectedRow(null);
    } else {
      alert("Error deleting issue policy!");
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      issue_name: "",
      description: "",
      recommendation: "",
      severity: "",
      type: "",
    });
    setShowPopup(false);
    setSelectedRow(null);
  };

  const paginatedData = issuePolicies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPagination = () => {
    const totalPages = Math.ceil(issuePolicies.length / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
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
        <button className="active-page">{currentPage}</button>
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

  return (
    <div className="admin-content">
      <h2>Issue Policy</h2>
      <p>This is the Issue Policy page for admin.</p>

      <div className="admin-header">
        <div className="admin-buttons">
          <button onClick={() => setShowPopup(true)}>➕ Add</button>
          <button
            onClick={() => {
              if (selectedRow) {
                setFormData({
                  issue_name: selectedRow.issue_name,
                  description: selectedRow.description,
                  recommendation: selectedRow.recommendation,
                  severity: selectedRow.severity,
                  type: selectedRow.type,
                });
                setShowPopup(true);
              } else alert("No row selected.");
            }}
          >
            ✏️ Update
          </button>
          <button onClick={handleDelete}>🗑️ Delete</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-animation">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Sl. No</th>
                <th>Issue Name</th>
                <th>Description</th>
                <th>Recommendation</th>
                <th>Severity</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr
                  key={row.issue_id}
                  onClick={() => setSelectedRow(row)}
                  className={selectedRow?.issue_id === row.issue_id ? "selected-row" : ""}
                >
                  <td>
                    <input
                      type="radio"
                      name="select"
                      checked={selectedRow?.issue_id === row.issue_id}
                      readOnly
                    />
                  </td>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{row.issue_name}</td>
                  <td>{row.description}</td>
                  <td>{row.recommendation}</td>
                  <td>{row.severity}</td>
                  <td>{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderPagination()}
        </>
      )}

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>{selectedRow ? "Update Issue Policy" : "Add Issue Policy"}</h3>
            <input
              type="text"
              placeholder="Issue Name"
              value={formData.issue_name}
              onChange={(e) => setFormData({ ...formData, issue_name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <textarea
              placeholder="Recommendation"
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
            />
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            >
              <option value="">Select Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="">Select Type</option>
              <option value="seo">SEO</option>
              <option value="ui/ux">UI/UX</option>
            </select>
            <div className="popup-actions">
              <button onClick={handleAddOrUpdate} disabled={loading}>
                {loading ? "Processing..." : selectedRow ? "Update" : "Add"}
              </button>
              <button onClick={resetForm} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIssuePolicy;