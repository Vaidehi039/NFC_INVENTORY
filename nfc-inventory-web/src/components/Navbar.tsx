import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nfc, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 1000, 
      background: 'rgba(255, 255, 255, 0.8)', 
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Nfc color="white" size={24} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '-0.5px' }}>
            NFC <span style={{ color: 'var(--primary)' }}>Inventory</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'none', gap: '32px', alignItems: 'center' }} className="desktop-links">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                style={{ 
                  textDecoration: 'none', 
                  color: isActive(link.path) ? 'var(--primary)' : 'var(--text-main)', 
                  fontWeight: 600, 
                  fontSize: '0.95rem',
                  transition: 'color 0.2s'
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <Link to="/login" className="btn btn-primary" style={{ borderRadius: '12px', padding: '10px 24px' }}>
            Login
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }} 
            className="mobile-toggle"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: 'white', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}
          >
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  onClick={() => setIsOpen(false)}
                  style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem' }}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 768px) {
          .desktop-links { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-links { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
