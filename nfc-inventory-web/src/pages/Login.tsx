import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Nfc, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { googleLogin } from '../api';

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('password123');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { login } = await import('../api');
            const data = await login(email.trim(), password.trim());
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('role', data.user.role);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userEmail', data.user.email);
            navigate('/dashboard');
        } catch (err) {
            alert('Login failed: ' + err);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const data = await googleLogin(tokenResponse.access_token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('userName', data.user.name);
                localStorage.setItem('userEmail', data.user.email);
                navigate('/dashboard');
            } catch (err) {
                alert('Google Login failed: ' + err);
            }
        },
        onError: () => {
            alert('Google Login Failed');
        },
    });

    return (
        <div className="split-layout">
            <div className="hero-section">
                <div style={{ maxWidth: '500px' }}>
                    <div className="badge"
                        style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', marginBottom: '1.5rem', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, display: 'inline-block' }}>
                        v4.2 Enterprise Ready</div>
                    <h1
                        style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1, marginBottom: '1.5rem', letterSpacing: '-2px', color: 'white' }}>
                        Inventory <br />Redefined.</h1>
                    <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>Precision NFC tracking
                        meets elite warehouse management. Built for speed, scaled for global impact.</p>
                </div>

                <div
                    style={{ display: 'flex', gap: '3rem', marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' }}>
                    <div>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>14k+</h4>
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Daily Scans</p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>99.9%</h4>
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Uptime</p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>24/7</h4>
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>NFC Gateway</p>
                    </div>
                </div>
            </div>

            <div className="auth-section">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="auth-card"
                >
                    <div className="logo-container" style={{ justifyContent: 'flex-start', marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="logo-icon" style={{ width: '42px', height: '42px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Nfc size={24} />
                        </div>
                        <span className="logo-text" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--secondary)' }}>Aura NFC Control</span>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h2
                            style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>
                            Welcome back</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Please enter your details to sign in.</p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="social-btn"
                        onClick={() => handleGoogleLogin()}
                        type="button"
                    >
                        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" width="24" height="24" alt="Google" style={{ marginRight: '8px' }} />
                        <span>Sign in with Google</span>
                    </motion.button>

                    <div className="divider">or continue with email</div>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <label
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                                <input type="checkbox" style={{ width: '18px', height: '18px', borderRadius: '6px' }} />
                                Remember for 30 days
                            </label>
                            <Link to="/forgot-password"
                                style={{ color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 600 }}>Forgot
                                Password?</Link>
                        </div>

                        <button type="submit" className="btn btn-primary"
                            style={{ width: '100%', height: '52px', fontSize: '1rem', borderRadius: '12px' }}>
                            Sign In
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Don't have an account? <Link to="/register"
                            style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Register Now</Link>
                    </p>
                </motion.div>
            </div>

            <style>{`
                .split-layout {
                    display: grid;
                    grid-template-columns: 1.25fr 1fr;
                    height: 100vh;
                    overflow: hidden;
                }

                .hero-section {
                    background: linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.4)),
                        url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000');
                    background-size: cover;
                    background-position: center;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 5rem;
                    color: white;
                    position: relative;
                }

                .auth-section {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--bg-main);
                    padding: 3rem;
                    overflow-y: auto;
                }

                .auth-card {
                    width: 100%;
                    max-width: 440px;
                }

                .social-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 14px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    color: #1e293b;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 1.5rem;
                }

                .social-btn:hover {
                    background: #fcfcfc;
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                .divider {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin: 2rem 0;
                    color: var(--text-muted);
                    font-size: 0.875rem;
                }

                .divider::before,
                .divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: var(--border);
                }

                @media (max-width: 1024px) {
                    .split-layout {
                        grid-template-columns: 1fr;
                    }
                    .hero-section {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
