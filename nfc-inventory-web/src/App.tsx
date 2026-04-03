import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { updateUserStatus } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Scan from './pages/Scan';
import Settings from './pages/Settings';
import Validation from './pages/Validation';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

import Profile from './pages/Profile';

const App: React.FC = () => {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "761623348602-bh4m7h0kq8v17jbg4vps2m9788l5p2q7.apps.googleusercontent.com"; // Placeholder or user provided

  useEffect(() => {
    const syncStatus = async (status: 'online' | 'offline') => {
      const email = localStorage.getItem('userEmail');
      if (email) {
        try {
          await updateUserStatus(email, status);
        } catch (err) {
          console.error("Status sync failed", err);
        }
      }
    };

    // 1. Initial online status
    syncStatus('online');

    // 2. Heartbeat every 45s (staying within 60s threshold)
    const interval = setInterval(() => syncStatus('online'), 45000);

    // 3. Set offline on tab close (most reliable method)
    const handleUnload = () => {
      const email = localStorage.getItem('userEmail');
      const apiURL = window.location.origin + "/api/user/status";
      if (email) {
        const body = JSON.stringify({ email, status: 'offline' });
        navigator.sendBeacon(apiURL, body);
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 3000 }} />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/users" element={<Users />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/validation" element={<Validation />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
