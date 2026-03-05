import React from 'react';
import Sidebar from './Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content animate-fade" style={{ marginLeft: '260px', padding: '2rem', width: '100%', minHeight: '100vh' }}>
                {children}
            </main>
            <style>{`
                @media (max-width: 1024px) {
                    .main-content {
                        margin-left: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Layout;
