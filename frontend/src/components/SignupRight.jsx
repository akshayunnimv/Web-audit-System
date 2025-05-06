import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseclient"; 
import "./LoginRight.css";

const SignupRight = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const uploadProfilePicture = async (userId, file) => {
    if (!file) return null;
  
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${userId}.${fileExt}`;
  
    console.log("Uploading profile picture:", file.name);
  
    // ✅ Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("profilepicture") // ✅ Check if this is your actual bucket name
      .upload(filePath, file);
  
    if (error) {
      console.error("Error uploading image:", error.message);
      return null;
    }
  
    console.log("File uploaded successfully!", data);
  
    // ✅ Get public URL
    const { data: urlData } = supabase.storage.from("profilepicture").getPublicUrl(filePath);
    const profileUrl = urlData.publicUrl;
  
    console.log("Profile picture URL:", profileUrl);
    return profileUrl;
  };

  // ✅ Handle Signup Process
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone)) {
    setError("Phone number must be exactly 10 digits.");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError("Please enter a valid email address.");
    return;
  }

    // ✅ Step 1: Create a new user with Supabase Authentication
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("User ID not found after signup.");
      return;
    }

    // ✅ Step 2: Upload profile picture AFTER user is created
    let profilePictureUrl = null;
    if (profilePicture) {
      profilePictureUrl = await uploadProfilePicture(userId, profilePicture);
    }

    // ✅ Step 3: Insert user data into `tbl_user`
    const { error: insertError } = await supabase.from("tbl_user").insert([
      {
        id: userId, // Store Supabase user ID
        name,
        phone,
        email,
        profile_picture: profilePictureUrl, // Store uploaded image URL
        password, // ⚠️ Hash this password before storing in production!
        created_at: new Date().toISOString(), // Store signup time
      },
    ]);

    if (insertError) {
      setError(insertError.message);
    } else {
      console.log("User registered successfully!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="login-container">
      <div className="login-right">
        <h2>Sign Up</h2>
        <p>Create an account to get started</p>

        {error && <p className="error-message">{error}</p>}

        <form className="login-form" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            className="login-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
            className="login-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="file"
            className="login-input"
            onChange={(e) => setProfilePicture(e.target.files[0])}
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
          <input
            type="password"
            placeholder="Confirm Password"
            className="login-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">Sign Up</button>
        </form>

        <p className="signup-link">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default SignupRight;
