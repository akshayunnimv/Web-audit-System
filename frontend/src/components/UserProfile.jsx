import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseclient";
import "./Userprofile.css";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", profile_picture: "" });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true); // Start loading
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
    setLoading(false); // End loading
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
  
    // Extract file path from the URL
    const match = formData.profile_picture.match(/avatars\/[^?]+/);
    const filePath = match ? match[0] : null;
  
    if (filePath) {
      // Delete the image from Supabase Storage
      const { error: deleteError } = await supabase
        .storage
        .from("profilepicture")
        .remove([filePath]);
  
      if (deleteError) {
        alert("Failed to remove image from storage.");
        return;
      }
    }
  
    // Update the database (remove the image link)
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
            <button onClick={() => setEditMode(true)}>Edit</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
