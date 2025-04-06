import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseclient";
import Sidebar from "../components/Sidebar";
import DashboardContent from "../components/DashboardContent";
import CheckURL from "../components/CheckURL";
import Feedback from "../components/Feedback";
import "./Dashboard.css";


const Dashboard = ({ user }) => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate("/login"); // Redirect to login if not authenticated
      } else {
        setUsername(user.email);
      }
    };

    fetchUser();
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<DashboardContent user={user} />} />  
          <Route path="checkurl" element={<CheckURL user={user} />} />  
          <Route path="feedback" element={<Feedback user={user}/>} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
