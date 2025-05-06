import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseclient";
import "./Userprofile.css";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", profile_picture: "" });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("tbl_user")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error) {
        setUserData(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          profile_picture: data.profile_picture || "",
        });
      }
    }
    setLoading(false);
  };

  // Password change handlers
  const handlePasswordChange = async () => {
    setPasswordError("");
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    try {
      // First verify current password
      const { data: userData, error } = await supabase
        .from("tbl_user")
        .select("password")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (userData.password !== passwordData.currentPassword) {
        setPasswordError("Current password is incorrect");
        return;
      }

      // Update password in tbl_user
      const { error: updateError } = await supabase
        .from("tbl_user")
        .update({ password: passwordData.newPassword })
        .eq("id", user.id);

      if (updateError) throw updateError;

      alert("Password updated successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      setPasswordError("Failed to update password. Please try again.");
      console.error("Password update error:", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profilepicture")
      .upload(filePath, file);

    if (uploadError) {
      alert("Image upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("profilepicture")
      .getPublicUrl(filePath);

    setFormData((prev) => ({ ...prev, profile_picture: urlData.publicUrl }));
    setUploading(false);
  };

  const handleRemovePicture = async () => {
    const confirmed = window.confirm("Are you sure you want to remove your profile picture?");
    if (!confirmed) return;
  
    const match = formData.profile_picture.match(/avatars\/[^?]+/);
    const filePath = match ? match[0] : null;
  
    if (filePath) {
      const { error: deleteError } = await supabase
        .storage
        .from("profilepicture")
        .remove([filePath]);
  
      if (deleteError) {
        alert("Failed to remove image from storage.");
        return;
      }
    }
  
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("tbl_user")
      .update({ profile_picture: null })
      .eq("id", user.id);
  
    if (!error) {
      alert("Profile picture removed.");
      setFormData((prev) => ({ ...prev, profile_picture: "" }));
      fetchUserProfile();
    }
  };

  const handleUpdate = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("tbl_user")
      .update({
        name: formData.name,
        phone: formData.phone,
        profile_picture: formData.profile_picture,
      })
      .eq("id", user.id);

    if (!error) {
      alert("Profile updated successfully!");
      setEditMode(false);
      fetchUserProfile();
    }
  };
  
  if (loading) {
    return (
      <div className="loading-animation">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!userData) return <p>Loading profile...</p>;

  return (
    <div className="user-profile-container">
      <h2>User Profile</h2>
      <div className="profile-card">
        <img
          src={formData.profile_picture || "/default-image.png"}
          alt="Profile"
          className="profile-img"
        />
        {editMode && (
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
        )}
        {editMode && formData.profile_picture && (
        <button className="remove-btn" onClick={handleRemovePicture}>
        Remove Picture
        </button>
        )}

        <div className="profile-info">
          <label>Name:</label>
          {editMode ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          ) : (
            <p>{userData.name}</p>
          )}

          <label>Phone:</label>
          {editMode ? (
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          ) : (
            <p>{userData.phone}</p>
          )}

          <label>Email:</label>
          <p>{userData.email}</p>

          <label>Joined On:</label>
          <p>{new Date(userData.created_at).toLocaleString()}</p>
        </div>

        <div className="profile-actions">
          {editMode ? (
            <>
              <button onClick={handleUpdate}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(true)}>Edit</button>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="change-password-btn"
              >
                Change Password
              </button>
            </>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Change Password</h3>
            {passwordError && <p className="error-message">{passwordError}</p>}
            <div className="form-group">
              <label>Current Password:</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value
                })}
              />
            </div>
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value
                })}
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password:</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value
                })}
              />
            </div>
            <div className="modal-actions">
              <button onClick={handlePasswordChange}>Update Password</button>
              <button onClick={() => {
                setShowPasswordModal(false);
                setPasswordError("");
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: ""
                });
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;