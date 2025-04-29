import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseclient";
import Sidebar from "../components/Sidebar";
import DashboardContent from "../components/DashboardContent";
import CheckURL from "../components/CheckURL";
import Feedback from "../components/Feedback";
import UserProfile from "../components/UserProfile";
import UserActivity from "../components/UserActivity";
import "./Dashboard.css";

const Dashboard = ({ user }) => {
  const [username, setUsername] = useState("");
  const [minLoadingPassed, setMinLoadingPassed] = useState(false);
  const [updatingUserRecord, setUpdatingUserRecord] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingPassed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true; // Track component mount status

    const updateUserRecord = async (user) => {
      if (!user || !isMounted) return;
      
      setUpdatingUserRecord(true);
      
      const { id, email, user_metadata } = user;
      const name = user_metadata?.name || user_metadata?.full_name || email.split('@')[0];
      const last_login = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata' 
      });
      const profile_picture = user_metadata?.avatar_url || user_metadata?.picture || null;

      try {
        const { data: existingUser } = await supabase
          .from('tbl_user')
          .select('id')
          .eq('id', id)
          .single();

        if (existingUser) {
          await supabase
            .from('tbl_user')
            .update({ last_login })
            .eq('id', id);
        } else {
          await supabase
            .from('tbl_user')
            .insert([{ id, name, email, last_login, profile_picture }]);
        }
      } catch (error) {
        console.error('Failed to update user record:', error);
      } finally {
        if (isMounted) {
          setUpdatingUserRecord(false);
        }
      }
    };

    const fetchUser = async () => {
      if (!isMounted) return;
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate("/login");
      } else {
        setUsername(user.email);
        // Only update record if we're on the initial dashboard load
        if (location.pathname === '/dashboard') {
          await updateUserRecord(user);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
      setUpdatingUserRecord(false); // Reset loading state on unmount
    };
  }, [navigate, location.pathname]);

  if (updatingUserRecord || !minLoadingPassed) {
    return (
      <div className="user-update-loading">
        <div className="update-spinner"></div>
        <p>Setting up your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<DashboardContent user={user} />} />  
          <Route path="checkurl" element={<CheckURL user={user} />} />  
          <Route path="feedback" element={<Feedback user={user}/>} />
          <Route path="userprofile" element={<UserProfile user={user}/>} />
          <Route path="useractivity" element={<UserActivity user={user}/>}/>
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;