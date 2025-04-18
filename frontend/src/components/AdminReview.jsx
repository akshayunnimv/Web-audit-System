import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseclient";
import "./AdminReview.css";

const AdminReview = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 6;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("tbl_feedback")
      .select("*")
      .order("date", { ascending: false });

    if (feedbackError) {
      console.error("Error fetching feedback:", feedbackError);
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("tbl_user")
      .select("id, name");

    if (userError) {
      console.error("Error fetching users:", userError);
      setLoading(false);
      return;
    }

    const userMap = {};
    if (userData && Array.isArray(userData)) {
      userData.forEach((user) => {
        userMap[user.id] = user.name;
      });
    }

    setFeedbacks(feedbackData || []);
    setUsers(userMap);
    setLoading(false);
  };

  const paginatedFeedback = feedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return alert("Reply cannot be empty");
    setLoading(true);

    const { error } = await supabase
      .from("tbl_feedback")
      .update({ reply: replyText })
      .eq("feedback_id", selectedFeedback.feedback_id);

    setLoading(false);
    if (!error) {
      alert("Reply added!");
      setShowPopup(false);
      setReplyText("");
      setSelectedFeedback(null);
      fetchData();
    }
  };

  const handleDelete = async (feedback_id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this feedback?");
    if (!confirmDelete) return;
    setLoading(true);

    const { error } = await supabase
      .from("tbl_feedback")
      .delete()
      .eq("feedback_id", feedback_id);

    setLoading(false);
    if (error) {
      alert("Error deleting feedback!");
      console.error("Delete error:", error);
    } else {
      alert("Feedback deleted successfully.");
      fetchData();
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(feedbacks.length / itemsPerPage);
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
      <h2>Feedback Review</h2>
      
      {loading ? (
        <div className="loading-animation">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="feedback-list">
            {paginatedFeedback.map((item, index) => (
              <div className="feedback-card" key={item.feedback_id}>
                <div className="serial-number">{(currentPage - 1) * itemsPerPage + index + 1}</div>
                <h3>{users[item.user_id] || "Unknown User"}</h3>
                <p><strong>Feedback:</strong> {item.feedback}</p>
                <p><strong>Date:</strong> {formatDate(item.date)}</p>
                <p><strong>Reply:</strong> {item.reply || "N/A"}</p>
                <button 
                  className="reply-btn" 
                  onClick={() => {
                    setSelectedFeedback(item);
                    setReplyText(item.reply || "");
                    setShowPopup(true);
                  }}
                  disabled={loading}
                >
                  Reply
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(item.feedback_id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {renderPagination()}
        </>
      )}

      {/* Reply Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>Add Reply</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows="4"
              placeholder="Write your reply here..."
              disabled={loading}
            ></textarea>
            <div className="popup-actions">
              <button onClick={handleReplySubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </button>
              <button onClick={() => setShowPopup(false)} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReview;