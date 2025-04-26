import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  // Smooth scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Handle smooth scrolling for anchor links
  useEffect(() => {
    const handleAnchorClick = (e) => {
      // Check if the click is from an anchor link
      if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

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
        <p>This is a venture to experience the pinnacle of web designing, we invite every developers onboard to build their ultimate website with our help.</p>
        <p>We mainly focus on pointing out the Ui/Ux issues and SEO optimization issues so that it will ease your web-development.</p>
        <p>This will be your one-stop website auditing system where you can crawl your entire frontend and find its issues and keep track of your findings.</p>
        <br></br>
        <div className="cards">
          <div className="card">
            <h4>UI issues</h4>
            <p className="silver-text">"UI issues refers to problems or bugs within the User Interface (UI) of a software application, meaning issues with how the software looks and functions visually, potentially impacting the user experience."</p>
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
          <h2>HEading Later</h2>
          <p>Given below is the list of issue checks that are currently we can run on your webpage </p>
  <div className="issues-container">
    <div className="issues-column">
      <h3 className="issues-heading">UI/UX Issues We Detect</h3>
      <ul className="issues-list">
        <li>Use of Inline Styles</li>
        <li>Broken or Missing Image Sources</li>
        <li>Check Large Images Affecting Speed</li>
        <li>Analyze Readability & Long Paragraphs</li>
        <li>Excessive External JavaScript Files</li>
        <li>Excessive Redirects</li>
        <li>Presence of Empty Links or Buttons</li>
        <li>Buttons Missing Accessibility Labels</li>
        <li>Check Low Contrast Images</li>
        <li>Missing Image Alt Attributes</li>
        <li>Excessive Popups</li>
        <li>Low-Contrast Text</li>
        <li>Page responsiveness</li>
        <li>Slow Page Loading</li>
        <li>Large DOM size</li>
        <li>Auto-playing media</li>
        <li>Keyboard Trap</li>      
      </ul>
    </div>
    <div className="issues-column">
      <h3 className="issues-heading">SEO Issues We Detect</h3>
      <ul className="issues-list">
        <li>Missing Meta Description</li>
        <li>Missing h1 Tag</li>
        <li>Missing Viewport Meta Tag</li>
        <li>Broken External Links</li>
        <li>Duplicate Headings</li>
        <li>Missing Canonical Tag</li>
        <li>Missing title Tag</li>
        <li>Missing or Inaccessible Sitemap.xml</li>
        <li>Missing Structured Data (JSON-LD)</li>
        <li>Analyze Keyword Usage in Content</li>
        <li>Missing robots.txt File</li>
        <li>Check HTTPS Security</li>
        <li>Check for Thin Content</li>
        <li>Presence of Orphan Pages</li>
        <li>Non-descriptive URLs</li>
        <li>Render-blocking resources</li>
      </ul>
    </div>
  </div>
  
  <p className="issues-summary">
    Our comprehensive scanning technology identifies these common issues and more, 
    providing detailed reports with actionable recommendations to improve both 
    user experience and search engine visibility. Our System checks for 16 SEO issues and 17 UI/UX issues,So in total You
    can check for 33 issues that may cause you trouble.
  </p>
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
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <img src="/icons/x.png" alt="X" />
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
              <img src="/icons/linkedin.png" alt="LinkedIn" />
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
              <img src="/icons/instagram.png" alt="Instagram" />
            </a>
          </div>
        </div>
      </section>

      {/* Back to Top Button */}
      <button onClick={scrollToTop} className="back-to-top">↑</button>
    </div>
  );
};

export default Home;