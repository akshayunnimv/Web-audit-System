import React from "react";
import AuthLeft from "../components/AuthLeft";
import SignupRight from "../components/SignupRight";
import "./Login.css";

const Signup = () => {
  return (
    <div className="login-container">
      <AuthLeft />
      <SignupRight />
    </div>
  );
};

export default Signup;
