import React from 'react';
import { Link } from 'react-router-dom';
import { Nfc, Mail, Phone, MapPin, ExternalLink, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer style={{ 
      background: 'white', 
      borderTop: '1px solid var(--border)', 
      paddingTop: '5rem',
      paddingBottom: '3rem',
      color: 'var(--text-main)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          
          {/* Brand Column */}
          <div style={{ maxWidth: '320px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', marginBottom: '1.5rem' }}>
              <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Nfc color="white" size={20} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>NFC Inventory</span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Empowering businesses with precision tracking, real-time analytics, and seamless NFC-integrated inventory management for the digital era.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '2rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Home</Link>
              <Link to="/about" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>About Us</Link>
              <Link to="/contact" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Contact Us</Link>
              <Link to="/login" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Admin Login <ExternalLink size={12} /></Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '2rem' }}>Connect With Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--bg-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={16} />
                </div>
                <span>info@nfcinventory.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--bg-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={16} />
                </div>
                <span>+91 98765 43210</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--bg-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={16} />
                </div>
                <span>123 Innovation Street, Tech Hub, Mumbai</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} NFC Inventory System. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Terms of Service</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} /> English (US)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
