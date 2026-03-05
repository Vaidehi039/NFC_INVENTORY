import React, { useState } from 'react';
import Layout from '../components/Layout';
import { User, Shield, Bell, Lock, Globe, Database, Save, CheckCircle2 } from 'lucide-react';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const userName = localStorage.getItem('userName') || 'System Admin';
    const userEmail = localStorage.getItem('userEmail') || 'admin@example.com';
    const userRole = localStorage.getItem('role') || 'admin';

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1000);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="animate-slide">
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User size={20} className="text-primary" /> Personal Profile
                            </h2>
                            <div className="input-group">
                                <label>Display Name</label>
                                <input type="text" defaultValue={userName} />
                            </div>
                            <div className="input-group">
                                <label>Email Address</label>
                                <input type="email" defaultValue={userEmail} disabled />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Primary email cannot be changed by yourself.</p>
                            </div>
                            <div className="input-group">
                                <label>Current Role</label>
                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={14} style={{ color: 'var(--primary)' }} /> {userRole.toUpperCase()}
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626' }}>
                                <Lock size={20} /> Authentication
                            </h2>
                            <button className="btn btn-primary" style={{ background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border)' }}>Change Password</button>
                        </section>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="animate-slide">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Bell size={20} className="text-primary" /> Notification Center
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px' }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>Low Stock Alerts</div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Get notified when items fall below 10 units</p>
                                </div>
                                <input type="checkbox" defaultChecked style={{ width: '40px', height: '20px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px' }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>Security Logs</div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily email report of administrative actions</p>
                                </div>
                                <input type="checkbox" style={{ width: '40px', height: '20px' }} />
                            </div>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="animate-slide">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Lock size={20} className="text-primary" /> Security & Privacy
                        </h2>
                        <div className="input-group">
                            <label>Two-Factor Authentication</label>
                            <button className="btn" style={{ width: 'fit-content', border: '1px solid var(--border)' }}>Enable 2FA</button>
                        </div>
                        <div className="input-group">
                            <label>Session Timeout</label>
                            <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <option>1 Hour</option>
                                <option>8 Hours</option>
                                <option>24 Hours</option>
                            </select>
                        </div>
                    </div>
                );
            case 'language':
                return (
                    <div className="animate-slide">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Globe size={20} className="text-primary" /> Region & Language
                        </h2>
                        <div className="input-group">
                            <label>Default Language</label>
                            <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <option>English (US)</option>
                                <option>Hindi (India)</option>
                                <option>Gujarati (India)</option>
                            </select>
                        </div>
                    </div>
                );
            case 'system':
                return (
                    <div className="animate-slide">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Database size={20} className="text-primary" /> System Administration
                        </h2>
                        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Database Configuration</div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Connected to MySQL Production Instance</p>
                            <button className="btn" style={{ background: 'white', border: '1px solid var(--border)', fontSize: '0.8rem' }}>Check Health States</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Layout>
            <div className="animate-fade">
                <header style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>System Settings</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Configure your instance and personal preferences</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 3fr', gap: '2rem' }}>
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            onClick={() => setActiveTab('profile')}
                            style={{
                                padding: '12px 16px', borderRadius: '12px',
                                background: activeTab === 'profile' ? 'var(--primary)' : 'white',
                                border: activeTab === 'profile' ? 'none' : '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                fontWeight: activeTab === 'profile' ? 700 : 600,
                                textAlign: 'left', cursor: 'pointer',
                                color: activeTab === 'profile' ? 'white' : '#64748b'
                            }}
                        >
                            <User size={18} /> Profile Details
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            style={{
                                padding: '12px 16px', borderRadius: '12px',
                                background: activeTab === 'notifications' ? 'var(--primary)' : 'white',
                                border: activeTab === 'notifications' ? 'none' : '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                fontWeight: activeTab === 'notifications' ? 700 : 600,
                                textAlign: 'left', cursor: 'pointer',
                                color: activeTab === 'notifications' ? 'white' : '#64748b'
                            }}
                        >
                            <Bell size={18} /> Notifications
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            style={{
                                padding: '12px 16px', borderRadius: '12px',
                                background: activeTab === 'security' ? 'var(--primary)' : 'white',
                                border: activeTab === 'security' ? 'none' : '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                fontWeight: activeTab === 'security' ? 700 : 600,
                                textAlign: 'left', cursor: 'pointer',
                                color: activeTab === 'security' ? 'white' : '#64748b'
                            }}
                        >
                            <Lock size={18} /> Security
                        </button>
                        <button
                            onClick={() => setActiveTab('language')}
                            style={{
                                padding: '12px 16px', borderRadius: '12px',
                                background: activeTab === 'language' ? 'var(--primary)' : 'white',
                                border: activeTab === 'language' ? 'none' : '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                fontWeight: activeTab === 'language' ? 700 : 600,
                                textAlign: 'left', cursor: 'pointer',
                                color: activeTab === 'language' ? 'white' : '#64748b'
                            }}
                        >
                            <Globe size={18} /> Language
                        </button>
                        {(userRole === 'admin' || userRole === 'superadmin') && (
                            <button
                                onClick={() => setActiveTab('system')}
                                style={{
                                    padding: '12px 16px', borderRadius: '12px',
                                    background: activeTab === 'system' ? 'var(--primary)' : 'white',
                                    border: activeTab === 'system' ? 'none' : '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    fontWeight: activeTab === 'system' ? 700 : 600,
                                    textAlign: 'left', cursor: 'pointer',
                                    color: activeTab === 'system' ? 'white' : '#64748b'
                                }}
                            >
                                <Database size={18} /> System Audit
                            </button>
                        )}
                    </aside>

                    <main className="table-container" style={{ padding: '2.5rem', background: 'white', position: 'relative' }}>
                        {renderContent()}

                        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                            {saved && <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> Changes Saved!</span>}
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                {isSaving ? "Saving..." : <><Save size={18} /> Save Settings</>}
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
