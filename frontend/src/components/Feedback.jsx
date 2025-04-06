import React, { useState } from "react";
import { supabase } from "../supabaseclient";
import "./feedback.css";

const Feedback = () => {
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [slideVisible, setSlideVisible] = useState(false);
  const [filterType, setFilterType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("User not logged in.");
      return;
    }

    const response = await fetch("http://127.0.0.1:8000/submit-feedback/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, feedback }),
    });

    if (response.ok) {
      setMessage("Thank you for your feedback!");
      setFeedback("");
    } else {
      const result = await response.json();
      setMessage(`Error: ${result.detail}`);
    }
  };

  const fetchFeedbacks = async (type) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("User not logged in");
      return;
    }

    let query = supabase
      .from("tbl_feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (type === "Replied") query = query.not("reply", "is", null);
    if (type === "Not Replied") query = query.is("reply", null);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching feedbacks:", error);
    } else {
      setUserFeedbacks(data);
      setFilterType(type);
      setSlideVisible(true);
    }
  };

  return (
    <div className="feedback-wrapper">
      <div className="feedback-container">
        <h2>📝 Submit Feedback</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            rows="6"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write your feedback here..."
            required
          />
          <button type="submit">Send</button>
        </form>
        {message && <p className="feedback-message">{message}</p>}

        <div className="feedback-filter-buttons">
          <button onClick={() => fetchFeedbacks("All")}>All</button>
          <button onClick={() => fetchFeedbacks("Replied")}>Replied</button>
          <button onClick={() => fetchFeedbacks("Not Replied")}>Not Replied</button>
        </div>
      </div>

      {/* Slide-In Feedback Window */}
      <div className={`feedback-slide ${slideVisible ? "visible" : ""}`}>
        <h3>{filterType} Feedback</h3>
        <button className="close-btn" onClick={() => setSlideVisible(false)}>×</button>
        {userFeedbacks.length > 0 ? (
          userFeedbacks.map((fb, idx) => (
            <div key={fb.feedback_id} className="feedback-card">
              <p><strong>#{idx + 1}</strong></p>
              <p><strong>Feedback:</strong> {fb.feedback}</p>
              <p><strong>Date:</strong> {new Date(fb.date).toLocaleString()}</p>
              <p><strong>Reply:</strong> {fb.reply || "N/A"}</p>
            </div>
          ))
        ) : (
          <p style={{ color: "#ccc" }}>No feedback found.</p>
        )}
      </div>
    </div>
  );
};

export default Feedback;
