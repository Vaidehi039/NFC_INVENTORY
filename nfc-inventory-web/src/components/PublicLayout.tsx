import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: '80px' }} className="animate-fade">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
