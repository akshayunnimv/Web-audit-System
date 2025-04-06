import React from "react";
import AuthLeft from "../components/AuthLeft";
import LoginRight from "../components/LoginRight";
import "./Login.css";

const Login = () => {
  return (
    <div className="login-container">
      <AuthLeft />
      <LoginRight />
    </div>
  );
};

export default Login;
