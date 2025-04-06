import React, { useState } from "react";
import { supabase } from "../supabaseclient"; 
import { useNavigate } from "react-router-dom";
import "./LoginRight.css";

const AdminLoginRight = () => {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState(""); 
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Step 1: Query `tbl_admin` table for matching email/password
    const { data: admin, error: adminError } = await supabase
      .from("tbl_admin")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (adminError || !admin) {
      setError("Invalid credentials or admin not found.");
      return;
    }

    console.log("Admin Login Successful!", admin);
    navigate("/admin-dashboard");
  };

  return (
    <div className="login-container">
      <div className="login-right">
        <h2>Admin Login</h2>
        <p>Only for authorized access</p>
        {error && <p className="error-message">{error}</p>}

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Admin Email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginRight;
