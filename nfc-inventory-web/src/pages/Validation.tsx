import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Shield, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Validation: React.FC = () => {
    const [rules, setRules] = useState<any[]>([]);
    const [attempts, setAttempts] = useState<any[]>([]);
    
    // Form state
    const [newType, setNewType] = useState('category');
    const [newValue, setNewValue] = useState('');
    const [isAllowed, setIsAllowed] = useState(1);

    const fetchData = async () => {
        try {
            const [rulesRes, attemptsRes] = await Promise.all([
                api.get('/admin/validation-rules'),
                api.get('/admin/invalid-attempts')
            ]);
            setRules(rulesRes.data);
            setAttempts(attemptsRes.data);
        } catch (err) {
            toast.error("Failed to load validation data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newValue) return;
        try {
            await api.post('/admin/validation-rules', {
                type: newType,
                value: newValue,
                is_allowed: isAllowed
            });
            toast.success("Rule added successfully");
            setNewValue('');
            fetchData();
        } catch (err) {
            toast.error("Failed to add rule");
        }
    };

    const handleDeleteRule = async (id: number) => {
        try {
            await api.delete(`/admin/validation-rules/${id}`);
            toast.success("Rule removed");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete rule");
        }
    };

    return (
        <Layout>
            <div className="animate-fade">
                <header style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Validation & Security</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Configure product restrictions and monitor invalid attempts</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* RULES SECTION */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <Shield size={20} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Validation Rules</h2>
                        </div>

                        <form onSubmit={handleAddRule} style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Type</label>
                                    <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                                        <option value="category">Category</option>
                                        <option value="name">Product Name</option>
                                        <option value="sku">SKU</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Action</label>
                                    <select value={isAllowed} onChange={(e) => setIsAllowed(Number(e.target.value))} style={{ width: '100%', padding: '8px' }}>
                                        <option value={1}>ALLOWED</option>
                                        <option value={0}>RESTRICTED</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    placeholder="Enter value (e.g. Electronics)" 
                                    value={newValue} 
                                    onChange={(e) => setNewValue(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button type="submit" className="btn btn-primary" style={{ padding: '0 15px' }}>
                                    <Plus size={18} />
                                </button>
                            </div>
                            <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '8px' }}>
                                * If any 'ALLOWED' rules exist, only those items can be added. 'RESTRICTED' rules always block.
                            </p>
                        </form>

                        <div className="table-container" style={{ border: 'none' }}>
                            <table style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Rule</th>
                                        <th>Target</th>
                                        <th>Action</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.map(rule => (
                                        <tr key={rule.id}>
                                            <td style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>{rule.type}</td>
                                            <td style={{ fontWeight: 600 }}>{rule.value}</td>
                                            <td>
                                                <span style={{ 
                                                    padding: '2px 8px', 
                                                    borderRadius: '4px', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 800,
                                                    background: rule.is_allowed ? '#d1fae5' : '#fee2e2',
                                                    color: rule.is_allowed ? '#059669' : '#dc2626'
                                                }}>
                                                    {rule.is_allowed ? 'ALLOWED' : 'RESTRICTED'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteRule(rule.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {rules.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>No rules defined</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ATTEMPTS SECTION */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <AlertTriangle size={20} color="#f59e0b" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Security Logs</h2>
                        </div>

                        <div className="table-container" style={{ border: 'none' }}>
                            <table style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Item / Details</th>
                                        <th>Reason</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map(attempt => (
                                        <tr key={attempt.id}>
                                            <td>
                                                <div style={{ fontWeight: 700 }}>{attempt.item_name || 'N/A'}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{attempt.attempt_details}</div>
                                            </td>
                                            <td style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem' }}>
                                                {attempt.reason}
                                            </td>
                                            <td style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                {new Date(attempt.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {attempts.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8' }}>No security incidents</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Validation;
