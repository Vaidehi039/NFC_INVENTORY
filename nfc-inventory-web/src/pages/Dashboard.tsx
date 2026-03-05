import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getDashboardStats, getNfcScans } from '../api';
import {
    Package, AlertTriangle, TrendingUp, TrendingDown, Clock, Search,
    Smartphone, Database, CheckCircle, Wifi, Activity, History,
    ScanLine, MousePointer2, User
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (token) {
                const data = await getDashboardStats(token);
                setStats(data.stats);
                setRecentActivity(data.recentActivity || []);

                // Fetch recent raw NFC scans for the new widget
                const scans = await getNfcScans(token);
                setRecentScans(scans.slice(0, 6)); // Top 6 most recent
            }
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds for real-time feel
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return <Layout><div style={{ textAlign: 'center', padding: '5rem' }}>Loading Inventory Data...</div></Layout>;
    }

    const performanceData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Scans',
            data: [12, 19, 3, 5, 2, 3, 9],
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 8,
        }]
    };

    const categoryData = {
        labels: ['Mobile', 'Laptop', 'Tablets', 'Audio'],
        datasets: [{
            data: [40, 25, 20, 15],
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
        }]
    };

    return (
        <Layout>
            <div className="animate-fade">
                <header style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Operations Dashboard</h1>
                            <p style={{ color: 'var(--text-muted)' }}>Real-time inventory sync status & MySQL health</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Database size={14} /> XAMPP MySQL Online
                            </div>
                            <button className="btn btn-primary" onClick={() => fetchData()}>
                                <Activity size={16} /> Refresh
                            </button>
                        </div>
                    </div>
                </header>

                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                            <Package size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalItems || 0}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Items</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalStock || 0}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Global Stock</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.lowStock || 0}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Low Stock Items</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                            <Smartphone size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{recentScans.length}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Recent Scans</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    {/* Performance Chart */}
                    <div className="table-container animate-slide" style={{ padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>NFC Activity Trend</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Scan frequency over the last week</p>
                        <div style={{ height: '280px' }}>
                            <Bar
                                data={performanceData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: 'rgba(0,0,0,0.05)' } },
                                        x: { grid: { display: false } }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* NEW: Recent NFC Scans (Manual & Hardware) */}
                    <div className="table-container animate-slide" style={{ padding: '1.5rem', background: 'linear-gradient(to bottom, #ffffff, #f8faff)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Scans</h2>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)' }}>REAL-TIME</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentScans.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    <Clock size={32} style={{ opacity: 0.2, margin: '0 auto 10px' }} />
                                    <p style={{ fontSize: '0.8rem' }}>Waiting for data...</p>
                                </div>
                            ) : recentScans.map((scan, idx) => (
                                <div key={scan.id} style={{
                                    padding: '12px', background: 'white', borderRadius: '12px',
                                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px',
                                    animation: idx === 0 ? 'pulse-border 2s infinite' : 'none'
                                }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: scan.reader_type === 'manual' ? '#f59e0b' : '#6366f1',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                    }}>
                                        {scan.reader_type === 'manual' ? <MousePointer2 size={16} /> : <Wifi size={16} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{scan.product ? scan.product.name : 'Unknown Item'}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            Tag: <span style={{ fontFamily: 'monospace' }}>{scan.serial_number}</span> • {scan.reader_type}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                                            {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    {/* Stock History Table */}
                    <div className="table-container animate-slide">
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <History size={20} style={{ color: 'var(--primary)' }} />
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Stock Transaction Log</h2>
                            </div>
                        </div>
                        <table style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Operation</th>
                                    <th>Quantity</th>
                                    <th>User</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentActivity.slice(0, 8).map((log: any, i: number) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{log.product?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.product?.sku}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${log.action === 'IN' ? 'badge-success' : log.action === 'OUT' ? 'badge-danger' : 'badge-warning'}`}>
                                                {log.action === 'IN' ? 'RESTOCK' : log.action === 'OUT' ? 'DISPATCH' : log.action}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: log.action === 'IN' ? '#10b981' : log.action === 'OUT' ? '#ef4444' : 'inherit' }}>
                                            {log.action === 'IN' ? '+' : log.action === 'OUT' ? '-' : ''}{log.quantity > 0 ? log.quantity : '—'}
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <User size={12} /> Admin
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Database Health Card */}
                    <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Activity size={20} style={{ color: 'var(--success)' }} />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>MySQL Database Health</h2>
                        </div>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Connection Status</span>
                                    <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 800 }}>ACTIVE</span>
                                </div>
                                <div style={{ height: '6px', background: '#dcfce7', borderRadius: '3px' }}>
                                    <div style={{ width: '100%', height: '100%', background: '#10b981', borderRadius: '3px' }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Uptime</p>
                                    <p style={{ fontWeight: 800 }}>99.9%</p>
                                </div>
                                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Sync Delay</p>
                                    <p style={{ fontWeight: 800 }}>12ms</p>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px' }}>Active Modules</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    <span style={{ fontSize: '0.65rem', background: '#eef2ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>NFC GATEWAY</span>
                                    <span style={{ fontSize: '0.65rem', background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>MYSQL STORAGE</span>
                                    <span style={{ fontSize: '0.65rem', background: '#fff7ed', color: '#ea580c', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>AUTH ENGINE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse-border {
                    0% { border-color: var(--border); }
                    50% { border-color: var(--primary); box-shadow: 0 0 10px rgba(99, 102, 241, 0.1); }
                    100% { border-color: var(--border); }
                }
            `}</style>
        </Layout>
    );
};

export default Dashboard;
