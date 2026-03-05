import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Nfc, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../api";

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Registration failed");
        setIsLoading(false);
        return;
      }

      alert("Registration successful!");
      navigate("/");
    } catch {
      alert("Registration failed");
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const data = await googleLogin(tokenResponse.access_token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } catch {
        alert("Google Login failed");
      }
    }
  });

  return (
    <div className="register-container">
      {/* LEFT SIDE */}
      <div className="left-side">
        <div className="left-overlay">
          <h1>Scale Your Operations.</h1>

          <div className="feature-box">
            <div>
              <h3>500+</h3>
              <p>Warehouses</p>
            </div>
            <div>
              <h3>Instant</h3>
              <p>Syncing</p>
            </div>
            <div>
              <h3>Secure</h3>
              <p>Encryption</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-side">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="form-card"
        >
          <div className="logo-row">
            <Nfc size={28} />
            <h2>NFC Inventory Pro</h2>
          </div>

          <h3>Create Account</h3>

          <button
            onClick={() => handleGoogleLogin()}
            type="button"
            className="google-btn"
          >
            Sign up with Google
          </button>

          <div className="divider">
            <span>OR CONTINUE WITH EMAIL</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <label>Full Name</label>
            </div>

            <div className="input-group">
              <input
                type="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label>Email Address</label>
            </div>

            <div className="input-group">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value=""></option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
              <label>Select Role</label>
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label>Password</label>
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder=" "
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <label>Confirm Password</label>
            </div>

            <button type="submit" disabled={isLoading} className="primary-btn">
              {isLoading ? (
                <>
                  <Loader2 className="spin" size={18} />
                  Processing...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="login-text">
            Already have an account? <Link to="/">Sign In</Link>
          </p>
        </motion.div>
      </div>

      {/* CSS */}
      <style>{`
        .register-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        .left-side {
          background: url("https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=2070&auto=format&fit=crop")
          center/cover no-repeat;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .left-overlay {
          background: rgba(0,0,0,0.65);
          width: 100%;
          height: 100%;
          padding: 4rem;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .left-overlay h1 {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 3rem;
        }

        .feature-box {
          display: flex;
          gap: 3rem;
          border-top: 1px solid rgba(255,255,255,0.2);
          padding-top: 2rem;
        }

        .right-side {
          background: linear-gradient(135deg,#0f172a,#111c33);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .form-card {
          width: 100%;
          max-width: 420px;
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1rem;
        }

        .google-btn {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: white;
          cursor: pointer;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .divider {
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 12px;
          opacity: 0.6;
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .input-group input,
        .input-group select {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #2a3a55;
          background: #1e293b;
          color: white;
        }

        .input-group label {
          position: absolute;
          left: 14px;
          top: 14px;
          font-size: 14px;
          color: #94a3b8;
          transition: 0.2s;
          pointer-events: none;
        }

        .input-group input:focus + label,
        .input-group input:not(:placeholder-shown) + label,
        .input-group select:focus + label,
        .input-group select:not([value=""]) + label {
          top: -8px;
          left: 10px;
          font-size: 11px;
          background: #111c33;
          padding: 0 6px;
          color: #6366f1;
        }

        .primary-btn {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(90deg,#6366f1,#7c3aed);
          color: white;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .primary-btn:hover {
          opacity: 0.9;
        }

        .login-text {
          text-align: center;
          margin-top: 1.5rem;
        }

        .login-text a {
          color: #8b5cf6;
          text-decoration: none;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media(max-width: 900px) {
          .register-container {
            grid-template-columns: 1fr;
          }
          .left-side {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;