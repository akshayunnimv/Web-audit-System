import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";  
import { supabase } from "./supabaseclient";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard"; 
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();  

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
      setLoading(false);
    };

    getSession();

    // 🔹 Subscribe to authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      // ✅ Redirect users logging in from the login page
      if (session?.user && location.pathname === "/login") {
        navigate("/dashboard", { replace: true });
      }
    });

    // 🔹 Cleanup subscription to avoid memory leaks
    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="dot-pulse"></div>
        <p className="loading-text">Loading your experience...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/dashboard/*" element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} /> 
      <Route path="/admin-login" element={<AdminLogin />} /> 
      <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
