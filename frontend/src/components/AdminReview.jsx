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

  const itemsPerPage = 6;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  const { data: feedbackData, error: feedbackError } = await supabase
    .from("tbl_feedback")
    .select("*")
    .order("date", { ascending: false });

  if (feedbackError) {
    console.error("Error fetching feedback:", feedbackError);
    return;
  }

  const { data: userData, error: userError } = await supabase
    .from("tbl_user")
    .select("id, name");

  if (userError) {
    console.error("Error fetching users:", userError);
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

    const { error } = await supabase
      .from("tbl_feedback")
      .update({ reply: replyText })
      .eq("feedback_id", selectedFeedback.feedback_id);

    if (!error) {
      alert("Reply added!");
      setShowPopup(false);
      setReplyText("");
      setSelectedFeedback(null);
      fetchData();
    }
  };

  return (
    <div className="admin-content">
      <h2>Feedback Review</h2>
      <div className="feedback-list">
        {paginatedFeedback.map((item, index) => (
          <div className="feedback-card" key={item.feedback_id}>
            <div className="serial-number">{(currentPage - 1) * itemsPerPage + index + 1}</div>
            <h3>{users[item.user_id] || "Unknown User"}</h3>
            <p><strong>Feedback:</strong> {item.feedback}</p>
            <p><strong>Date:</strong> {formatDate(item.date)}</p>
            <p><strong>Reply:</strong> {item.reply || "N/A"}</p>
            <button onClick={() => {
              setSelectedFeedback(item);
              setReplyText(item.reply || "");
              setShowPopup(true);
            }}>
              Reply
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(feedbacks.length / itemsPerPage) }).map((_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active-page" : ""}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

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
            ></textarea>
            <div className="popup-actions">
              <button onClick={handleReplySubmit}>Submit</button>
              <button onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReview;
