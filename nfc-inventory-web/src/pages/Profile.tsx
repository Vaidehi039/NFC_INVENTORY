import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getProfile, updateProfile } from '../api';
import { User, Mail, Shield, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await getProfile();
            setUser(data);
            setFormData({
                name: data.name || '',
                email: data.email || '',
                password: '',
                confirmPassword: ''
            });
        } catch (err) {
            console.error("Failed to fetch profile", err);
            toast.error("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setSaving(true);
            const updateData: any = {
                name: formData.name,
                email: formData.email
            };
            if (formData.password) {
                updateData.password = formData.password;
            }

            await updateProfile(updateData);
            toast.success("Profile updated successfully");
            
            // Update localStorage if needed
            localStorage.setItem('userName', formData.name);
            localStorage.setItem('userEmail', formData.email);
            
            fetchProfile();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Loading Profile...</div></Layout>;
    }

    return (
        <Layout>
            <div className="animate-fade">
                <header style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>My Account Profile</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your personal information and security settings</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
                    {/* User Info Card */}
                    <div className="table-container" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div style={{ 
                            width: '96px', height: '96px', borderRadius: '50%', 
                            background: 'var(--primary)', color: 'white', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', fontWeight: 800, margin: '0 auto 1.5rem',
                            boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)'
                        }}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{user?.name}</h2>
                        <div style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '6px', 
                            padding: '6px 12px', background: '#f1f5f9', borderRadius: '20px',
                            fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)'
                        }}>
                            <Shield size={14} /> {user?.role}
                        </div>
                        
                        <div style={{ marginTop: '2rem', textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '-2px' }}>Email Address</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.email}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Shield size={16} style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '-2px' }}>Account Status</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#16a34a' }}>Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="table-container" style={{ padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>Update Personal Information</h3>
                        
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input 
                                            name="name" type="text" value={formData.name} onChange={handleChange} required
                                            style={{ padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input 
                                            name="email" type="email" value={formData.email} onChange={handleChange} required
                                            style={{ padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)' }}>Security Settings</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                name="password" type={showPassword ? 'text' : 'password'} 
                                                value={formData.password} onChange={handleChange} placeholder="••••••••"
                                                style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Confirm Password</label>
                                        <input 
                                            name="confirmPassword" type={showPassword ? 'text' : 'password'} 
                                            value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
                                            style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Leave blank to keep your current password.
                                </p>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={saving} style={{ 
                                marginTop: '1rem', width: '100%', padding: '14px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' 
                            }}>
                                {saving ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Save size={18} /> Update Profile Settings
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
