import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseclient";
import "./adminhome.css";

const AdminHome = () => {
  const [userCount, setUserCount] = useState(0);
  const [policyCount, setPolicyCount] = useState(0);
  const [urlCount, setUrlCount] = useState(0);
  const [feedbackCount,setFeedbackCount]=useState(0);

  const [displayUserCount, setDisplayUserCount] = useState(0);
  const [displayPolicyCount, setDisplayPolicyCount] = useState(0);
  const [displayUrlCount, setDisplayUrlCount] = useState(0);
  const[displayFeedbackCount,setDisplayFeedbackCount]=useState(0)

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: users } = await supabase.from("tbl_user").select("id");
      const { data: policies } = await supabase.from("tbl_issuepolicy").select("issue_id");
      const { data: urls } = await supabase.from("tbl_crawledurls").select("url_id");
      const { data:feedbacks } = await supabase.from("tbl_feedback").select("feedback_id");

      const usersLen = users?.length || 0;
      const policiesLen = policies?.length || 0;
      const urlsLen = urls?.length || 0;
      const feedbackLen =feedbacks?.length || 0;

      setUserCount(usersLen);
      setPolicyCount(policiesLen);
      setUrlCount(urlsLen);
      setFeedbackCount(feedbackLen);
    };

    fetchCounts();
  }, []);

  // Animate count up
  useEffect(() => {
    const animateCount = (target, setter) => {
      let start = 0;
      const duration = 800; // ms
      const steps = 30;
      const increment = target / steps;
      const interval = duration / steps;

      const intervalId = setInterval(() => {
        start += increment;
        if (start >= target) {
          setter(target);
          clearInterval(intervalId);
        } else {
          setter(Math.floor(start));
        }
      }, interval);
    };

    animateCount(userCount, setDisplayUserCount);
    animateCount(policyCount, setDisplayPolicyCount);
    animateCount(urlCount, setDisplayUrlCount);
    animateCount(feedbackCount, setDisplayFeedbackCount);
  }, [userCount, policyCount, urlCount,feedbackCount]);

  return (
    <div className="admin-content">
      <h1>Welcome, Admin</h1>
      <p>This is your professional dasboard,always remember that you are in CHARGE!!!</p>

      <div className="admin-card-container">
        <div className="admin-card">
          <img src="/icons/user.png" alt="Users" />
          <h3>No. of Users</h3>
          <p className="count">{displayUserCount}</p>
          <button onClick={() => navigate("/admin-dashboard/users")}>View More</button>
        </div>

        <div className="admin-card">
          <img src="/icons/contract.png" alt="Policies" />
          <h3>Active Issue Policies</h3>
          <p className="count">{displayPolicyCount}</p>
          <button onClick={() => navigate("/admin-dashboard/issuepolicy")}>View More</button>
        </div>

        <div className="admin-card">
          <img src="/icons/check.png" alt="Pages" />
          <h3>Pages Checked</h3>
          <p className="count">{displayUrlCount}</p>
          <button onClick={() => navigate("/admin-dashboard/statistics")}>View More</button>
        </div>
        <div className="admin-card">
          <img src="/icons/customer-review.png" alt="Review" />
          <h3>No. of Feedbacks</h3>
          <p className="count">{displayFeedbackCount}</p>
          <button onClick={() => navigate("/admin-dashboard/review")}>View More</button>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
