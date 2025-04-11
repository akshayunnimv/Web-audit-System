import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseclient";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const fetchUserDetails = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from("tbl_user")
          .select("name, profile_picture")
          .eq("id", user.id)
          .single();

        if (!error) {
          setProfile(data);
        }
      }
    };

    fetchUserDetails();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      <h2 className="app-name">SITE INTEL</h2>
      <nav>
        <ul>
          <li
            className={location.pathname === "/dashboard" ? "active" : ""}
            onClick={() => handleNavigate("/dashboard")}
          >
            <img className="side-icon" src="/home.png"></img> Dashboard
          </li>
          <li
            className={location.pathname === "/dashboard/checkurl" ? "active" : ""}
            onClick={() => handleNavigate("/dashboard/checkurl")}
          >
            <img className="side-icon" src="/analysis.png"></img> Check URL
          </li>
          <li
            className={location.pathname === "/dashboard/feedback" ? "active" : ""}
            onClick={() => handleNavigate("/dashboard/feedback")}
          >
            <img className="side-icon" src="/feedback.png"></img> Feedback
          </li>
          <li
            className={location.pathname === "/dashboard/useractivity" ? "active" : ""}
            onClick={() => handleNavigate("/dashboard/useractivity")}
          >
            <img className="side-icon" src="/history.png"></img> Activity history
          </li>
          <li onClick={handleLogout} className="logout"><img className="side-icon" src="/log-out.png"></img> Logout</li>
        </ul>
      </nav>
      {profile && (
        <div className="sidebar-profile" onClick={() => navigate("/dashboard/userprofile")}>
          <img
            src={profile.profile_picture || "/default-image.png"}
            alt="Profile"
            className="profile-picture"
          />
          <span className="profile-name">{profile.name}</span>
        </div>
      )}
    </div>
  );
};

export default Sidebar;