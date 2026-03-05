import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Nfc, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { forgotPassword } from '../api';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await forgotPassword(email);
            setIsSent(true);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-layout" style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    margin: '20px',
                    padding: '2.5rem',
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--primary)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        margin: '0 auto 1.5rem'
                    }}>
                        <Nfc size={28} />
                    </div>

                    {!isSent ? (
                        <>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Forgot Password?</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No worries, we'll send you reset instructions.</p>
                        </>
                    ) : (
                        <>
                            <div style={{ color: '#16a34a', marginBottom: '1rem' }}>
                                <CheckCircle2 size={48} style={{ margin: '0 auto' }} />
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Check your email</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>We sent a password reset link to <br /><strong>{email}</strong></p>
                        </>
                    )}
                </div>

                {!isSent ? (
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ paddingLeft: '40px' }}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div style={{ color: '#dc2626', background: '#fef2f2', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                            style={{ width: '100%', height: '52px', fontSize: '1rem', borderRadius: '12px', marginTop: '1rem' }}
                        >
                            {isLoading ? 'Sending...' : 'Reset Password'}
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsSent(false)}
                        className="btn btn-primary"
                        style={{ width: '100%', height: '52px', fontSize: '1rem', borderRadius: '12px', marginTop: '1rem' }}
                    >
                        Resend Email
                    </button>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}>
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
