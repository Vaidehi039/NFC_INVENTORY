import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Scan, Settings, LogOut, Nfc, Users, History, X, UserCircle } from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const userRole = localStorage.getItem('role') || 'staff';
    
    // Permission flags based on the new RBAC request
    const isManager = userRole === 'manager' || userRole === 'admin' || userRole === 'superadmin';
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const isSuperAdmin = userRole === 'superadmin';

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="mobile-close" onClick={onClose} style={{ display: 'none', position: 'absolute', top: '20px', right: '20px', cursor: 'pointer' }}>
                <X size={24} />
            </div>
            <div className="logo-container">
                <div className="logo-icon">
                    <Nfc size={24} />
                </div>
                <span className="logo-text">NFC Inventory Control</span>
            </div>

            <nav className="nav-links">
                <div className="nav-item" onClick={onClose}>
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </NavLink>
                </div>
                
                {isManager && (
                    <div className="nav-item" onClick={onClose}>
                        <NavLink
                            to="/products"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <Package size={20} />
                            Products
                        </NavLink>
                    </div>
                )}

                <div className="nav-item" onClick={onClose}>
                    <NavLink
                        to="/scan"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Scan size={20} />
                        Scan NFC
                    </NavLink>
                </div>

                {isAdmin && (
                    <div className="nav-item" onClick={onClose}>
                        <NavLink
                            to="/users"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <Users size={20} />
                            Users
                        </NavLink>
                    </div>
                )}

                {isManager && (
                    <div className="nav-item" onClick={onClose}>
                        <NavLink
                            to="/logs"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <History size={20} />
                            Audit Logs
                        </NavLink>
                    </div>
                )}

                <div className="nav-item" onClick={onClose}>
                    <NavLink
                        to="/profile"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <UserCircle size={20} />
                        My Profile
                    </NavLink>
                </div>

                {isSuperAdmin && (
                    <div className="nav-item" onClick={onClose}>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <Settings size={20} />
                            Settings
                        </NavLink>
                    </div>
                )}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <NavLink
                    to="/"
                    className="nav-link"
                    style={{ color: '#ef4444' }}
                >
                    <LogOut size={20} />
                    Sign Out
                </NavLink>
            </div>

            <style>{`
                .sidebar {
                    position: fixed;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 260px;
                    background-color: var(--secondary);
                    color: white;
                    padding: 2rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    z-index: 100;
                    transition: transform 0.3s ease;
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 2rem;
                }

                .logo-icon {
                    width: 42px;
                    height: 42px;
                    background: var(--primary);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .logo-text {
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    color: white;
                }

                .nav-links {
                    list-style: none;
                    margin-top: 3rem;
                }

                .nav-item {
                    margin-bottom: 8px;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    color: #94a3b8;
                    text-decoration: none;
                    border-radius: var(--radius-md);
                    transition: all 0.2s;
                    font-weight: 500;
                }

                .nav-link:hover,
                .nav-link.active {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .nav-link.active {
                    background-color: var(--primary);
                }

                @media (max-width: 1024px) {
                    .sidebar {
                        transform: translateX(-100%);
                    }
                    .sidebar.open {
                        transform: translateX(0);
                    }
                    .mobile-close {
                        display: block !important;
                    }
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
