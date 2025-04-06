import React from "react";
import AuthLeft from "../components/AuthLeft";
import AdminLoginRight from "../components/AdminLoginRight";
import "./Login.css";

const AdminLogin = () => {
  return (
    <div className="login-container">
      <AuthLeft />
      <AdminLoginRight />
    </div>
  );
};

export default AdminLogin;
