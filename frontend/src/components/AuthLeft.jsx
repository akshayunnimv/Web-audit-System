import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "./AuthLeft.css"; // Styles for this component
import { useNavigate } from "react-router-dom";

const AuthLeft = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-left">
      {/* Background Overlay */}
      <div className="auth-overlay"></div>

      {/* Top Left - Home Button */}
      <button className="home-button" onClick={() => navigate("/")}>
        {/* Placeholder for Home Icon */}
        <span className="icon">🏠</span> {/* replace with actual icon later */}
        Home
      </button>

      {/* Logo */}
      <div className="auth-logo">
        <h1>Site Intel</h1>
      </div>

      {/* Text Carousel */}
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={true}
        className="auth-carousel"
      >
        <SwiperSlide><p>Welcome to our platform!</p></SwiperSlide>
        <SwiperSlide><p>Enhance your experience with our features.</p></SwiperSlide>
        <SwiperSlide><p>Sign up now to get started!</p></SwiperSlide>
      </Swiper>

      {/* Bottom Buttons */}
      <div className="login-options">
        <button className="login-option" onClick={() => navigate("/admin-login")}>
          {/* Placeholder Icon */}
          <span className="icon">🛡️</span>
          Login as Admin
        </button>
        <button className="login-option" onClick={() => navigate("/login")}>
          {/* Placeholder Icon */}
          <span className="icon">👤</span>
          Login as User
        </button>
      </div>
    </div>
  );
};

export default AuthLeft;
