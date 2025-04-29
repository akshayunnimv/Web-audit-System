import React, { useState } from "react";
import { supabase } from "../supabaseclient"; 
import { useNavigate } from "react-router-dom";
import "./LoginRight.css";

const Login = () => {
  // ✅ Add State Variables
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState(""); 
  const navigate = useNavigate(); 

  // ✅ Move handleLogin Inside Login Component
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Step 1: Authenticate user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    console.log("Login Successful!", data);

    // ✅ Step 2: Fetch user details from `tbl_user`
    const { data: userData, error: userError } = await supabase
      .from("tbl_user")
      .select("id") // Select only the `id`
      .eq("email", email)
      .single();

    if (userError || !userData) {
      setError("User not found in system. Please sign up first.");
      return;
    }

    const userId = userData.id; // Get the user ID

    // ✅ Step 3: Update the `last_login` timestamp
    // const { error: updateError } = await supabase
    //   .from("tbl_user")
    //   .update({ last_login: new Date().toISOString() }) 
    //   .eq("id", userId); 

    // if (updateError) {
    //   console.error("Failed to update last login:", updateError);
    // } else {
    //   console.log("Last login updated successfully!");
    // }

    // ✅ Step 4: Redirect to dashboard
    navigate("/dashboard");
  };

  const handleSocialLogin = async (provider) => {
    const { error, data } = await supabase.auth.signInWithOAuth({ provider });

    if (error) {
      setError(error.message);
    } else {
      console.log(`Redirecting to ${provider} login...`);
      // Wait for the session update
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        navigate("/dashboard"); 
      }
    }
  };

  // ✅ Make sure return is inside the function
  return (
    <div className="login-container">
      {/* Right Side - Login Section */}
      <div className="login-right">
        <h2>Login</h2>
        <p>Sign in to continue</p>

        {/* Display errors if any */}
        {error && <p className="error-message">{error}</p>}

        {/* User Login Form */}
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
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

        {/* Signup Link */}
        <p className="signup-link">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>

        {/* Separator */}
        <div className="separator">
          <span>OR Continue With</span>
        </div>

        {/* Social Login Buttons */}
        <button className="google-login" onClick={() => handleSocialLogin("google")}>
          <img src="/icons/google-logo.png" alt="Google Logo" />
          Login with Google
        </button>

        <button className="github-login" onClick={() => handleSocialLogin("github")}>
          <img src="/icons/github-logo.png" alt="GitHub Logo" />
          Login with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;
