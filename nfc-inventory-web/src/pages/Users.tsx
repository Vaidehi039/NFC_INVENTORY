import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getUsers, updateUser, deleteUser } from '../api';
import { Shield, UserX, UserCheck, Mail, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Users: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUserRole = localStorage.getItem('role') || 'user';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            if (!localStorage.getItem('token')) return;
            const data = await getUsers();
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
            await updateUser(user.id, { is_active: newStatus });
            toast.success(`User successfully ${action}ed`);
            fetchUsers();
        } catch (err) {
            toast.error("Failed to update user status");
        }
    };

    const handleDeleteUser = async (user: any) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete user ${user.name}? This cannot be undone.`)) return;

        try {
            await deleteUser(user.id);
            toast.success("User deleted successfully");
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete user");
        }
    };

    const handleRoleChange = async (user: any, newRole: string) => {
        try {
            await updateUser(user.id, { role: newRole });
            toast.success("User role updated successfully");
            fetchUsers();
        } catch (err) {
            toast.error("Failed to update user role");
        }
    };

    if (currentUserRole !== 'admin' && currentUserRole !== 'superadmin' && currentUserRole !== 'manager') {
        return <Layout><div className="p-8 text-center">Unauthorized. Only Admins and Managers can view this page.</div></Layout>;
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
                                    <td key={user.id}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img 
                                                    src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                                                    alt="Avatar" 
                                                    style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)' }} 
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: -2,
                                                    right: -2,
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    backgroundColor: user.status === 'online' ? '#22c55e' : '#94a3b8',
                                                    border: '2px solid white',
                                                    boxShadow: user.status === 'online' ? '0 0 8px rgba(34, 197, 94, 0.5)' : 'none'
                                                }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.name}</div>
                                                <div style={{ 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 800, 
                                                    color: user.role === 'admin' || user.role === 'superadmin' ? 'var(--primary)' : 'var(--text-muted)', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {(user.role === 'admin' || user.role === 'superadmin') && <Shield size={10} />}
                                                    {user.role}
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '99px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 700,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                width: 'fit-content',
                                                backgroundColor: user.status === 'online' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                                color: user.status === 'online' ? '#16a34a' : '#64748b'
                                            }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: user.status === 'online' ? '#22c55e' : '#94a3b8' }} />
                                                {user.status === 'online' ? "Online" : "Offline"}
                                            </span>
                                            {user.is_active === 0 && (
                                                <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>• Account Blocked</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {user.role === 'superadmin' && currentUserRole !== 'superadmin' ? (
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', padding: '6px 12px' }}>
                                                Root Access
                                            </span>
                                        ) : (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user, e.target.value)}
                                                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                                                disabled={user.role === 'superadmin'}
                                            >
                                                <option value="staff">Staff</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                                {/* Only show Superadmin option if current user IS a Superadmin */}
                                                {currentUserRole === 'superadmin' && (
                                                    <option value="superadmin">Superadmin</option>
                                                )}
                                            </select>
                                        )}
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
                                                disabled={user.role === 'superadmin' && currentUserRole !== 'superadmin'}
                                                onClick={() => handleStatusToggle(user)}
                                            >
                                                {user.is_active === 1 ? <><UserX size={12} style={{ marginRight: '6px' }} /> Block</> : <><UserCheck size={12} style={{ marginRight: '6px' }} /> Unblock</>}
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '6px 10px', background: '#f8fafc', color: '#64748b', border: '1px solid var(--border)' }}
                                                onClick={() => handleDeleteUser(user)}
                                                disabled={user.role === 'superadmin' && currentUserRole !== 'superadmin'}
                                                title={user.role === 'superadmin' ? "Superadmin cannot be deleted" : "Delete User"}
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
