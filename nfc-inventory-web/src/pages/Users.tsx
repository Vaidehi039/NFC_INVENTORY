import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getUsers, updateUser, deleteUser } from '../api';
import { Shield, UserX, UserCheck, Mail, Trash2 } from 'lucide-react';

const Users: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUserRole = localStorage.getItem('role') || 'user';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;
            const data = await getUsers(token);
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusToggle = async (user: any) => {
        const newStatus = user.is_active === 1 ? 0 : 1;
        const action = newStatus === 1 ? "unblock" : "block";
        if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

        try {
            const token = localStorage.getItem('token');
            await updateUser(token, user.id, { is_active: newStatus });
            fetchUsers();
        } catch (err) {
            alert("Failed to update user status");
        }
    };

    const handleDeleteUser = async (user: any) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete user ${user.name}? This cannot be undone.`)) return;

        try {
            const token = localStorage.getItem('token');
            await deleteUser(token, user.id);
            alert("User deleted successfully");
            fetchUsers();
        } catch (err: any) {
            alert(err.message || "Failed to delete user");
        }
    };

    const handleRoleChange = async (user: any, newRole: string) => {
        try {
            const token = localStorage.getItem('token');
            await updateUser(token, user.id, { role: newRole });
            fetchUsers();
        } catch (err) {
            alert("Failed to update user role");
        }
    };

    if (currentUserRole !== 'admin' && currentUserRole !== 'superadmin') {
        return <Layout><div className="p-8 text-center">Unauthorized. Only Administrators can view this page.</div></Layout>;
    }

    return (
        <Layout>
            <div className="animate-fade">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>User Management</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage your team, assign roles, and control access permissions</p>
                    </div>
                </header>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name & Role</th>
                                <th>Email Address</th>
                                <th>Status</th>
                                <th>Permissions</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Fetching user directory...</td></tr>
                            ) : users.map((user) => (
                                <tr key={user.id} style={{ opacity: user.is_active === 0 ? 0.6 : 1 }}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{user.name}</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: user.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {user.role === 'admin' && <Shield size={10} />} {user.role.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                                            <Mail size={14} style={{ opacity: 0.5 }} /> {user.email}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.is_active === 1 ? 'badge-success' : 'badge-danger'}`}>
                                            {user.is_active === 1 ? "Active" : "Blocked"}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user, e.target.value)}
                                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                                        >
                                            <option value="user">Staff</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '6px 14px',
                                                    background: user.is_active === 1 ? '#fee2e2' : '#f0fdf4',
                                                    color: user.is_active === 1 ? '#dc2626' : '#16a34a',
                                                    flex: 1
                                                }}
                                                onClick={() => handleStatusToggle(user)}
                                            >
                                                {user.is_active === 1 ? <><UserX size={12} style={{ marginRight: '6px' }} /> Block</> : <><UserCheck size={12} style={{ marginRight: '6px' }} /> Unblock</>}
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '6px 10px', background: '#f8fafc', color: '#64748b', border: '1px solid var(--border)' }}
                                                onClick={() => handleDeleteUser(user)}
                                                title="Delete User"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Users;
