import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";
const Home = () => {
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Site Intel</div>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#contact">Contact Us</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Site intel</h1>
          <p>Your one-stop solution for web security and auditing.</p>
          <div className="buttons">
          <Link to="/login" className="btn">Login</Link>
          <Link to="/signup" className="btn">Sign Up</Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <h2>About Us</h2>
        <p>This is a venture to  experience the pinnacle of web designing,we invite every developers onboard to build their ultimate website with our help.</p>
        <p>We mainly focus on pointing out the Ui/Ux issues and SEO optimization issues so that it will ease your web-development.</p>
        <p>This will be your one-stop website auditing system where you can crawl your entire frontend and find its issues and keep track of your findings.  </p>
        <br></br>
        <div className="cards">
          <div className="card">
            <h4>UI issues</h4>
            <p className="silver-text" >"UI issues refers to problems or bugs within the User Interface (UI) of a software application, meaning issues with how the software looks and functions visually, potentially impacting the user experience."  </p>
          </div>
          <div className="card">
            <h4>UX issues</h4>
            <p className="silver-text">"UX issues refer to problems or areas for improvement within the user experience (UX) of a product, service, or system, impacting how users interact with and perceive it."</p>
          </div>
          <div className="card">
            <h4>SEO issues</h4>
            <p className="silver-text">"In web development, SEO issues refer to problems with a website's structure, code, or content that negatively impact its ability to be found and ranked well in search engine results pages (SERPs), hindering its visibility and organic traffic."</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <h2>Contact Us</h2>
        <div className="contact-content">
          <div className="contact-info">
            <p>📞 +91 7306986979</p>
            <p>✉️ siteintelcorp@gmail.com</p>
            <p>📍 St.Joseph's College of Engineering<br></br>&nbsp;&nbsp;&nbsp;&nbsp; And Technology,Palai</p>
          </div>
          <div className="social-icons">
          <a href="https://twitter.com" target="_blank">
          <img src="/icons/x.png" alt="X" />
          </a>
          <a href="https://www.linkedin.com" target="_blank">
          <img src="/icons/linkedin.png" alt="LinkedIn" />
          </a>
          <a href="https://www.instagram.com" target="_blank">
          <img src="/icons/instagram.png" alt="Instagram" />
          </a>
          </div>
        </div>
      </section>

      {/* Back to Top Button */}
      <a href="#" className="back-to-top">↑</a>
    </div>
  );
};

export default Home;
