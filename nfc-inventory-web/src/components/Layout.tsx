import React from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div style={{ display: 'flex' }}>
            {/* Mobile Menu Toggle Button */}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{ 
                    position: 'fixed', 
                    bottom: '20px', 
                    right: '20px', 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)', 
                    zIndex: 1001,
                    display: 'none', // Hidden on desktop, toggled via media query
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
                className="mobile-menu-btn"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="main-content animate-fade" style={{ marginLeft: '260px', padding: '2rem', flex: 1, minHeight: '100vh' }}>
                {children}
            </main>
            <style>{`
                @media (max-width: 1024px) {
                    .main-content {
                        margin-left: 0 !important;
                    }
                    .mobile-menu-btn {
                        display: flex !important;
                    }
                }
                @media print {
                    .no-print, .mobile-menu-btn, .sidebar, .sidebar-container {
                        display: none !important;
                    }
                    .main-content {
                        margin-left: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        background: white !important;
                    }
                    .table-container {
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .btn {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Layout;
