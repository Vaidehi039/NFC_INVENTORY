import React, { useState } from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, HelpCircle, MessageSquare, Twitter, Linkedin, Github, ShieldCheck, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        toast.success("Message received! We'll be in touch shortly.");
        setForm({ name: '', email: '', message: '' });
        setLoading(false);
    }, 1500);
  };

  return (
    <PublicLayout>
      <section style={{ padding: '8rem 2rem 10rem', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-3px', color: 'var(--secondary)' }}
            >
              Get In Touch
            </motion.h1>
            <p style={{ fontSize: '1.250rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>
              Interested in our system or need enterprise-grade support? Our technical logistics experts are standing by.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '4rem', alignItems: 'start' }}>
            
            {/* Left Column: Contact Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div className="glass-card" style={{ padding: '3rem', borderRadius: '32px', display: 'flex', alignItems: 'center', gap: '2rem', border: '1px solid var(--border)', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={32} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--secondary)' }}>Email Us</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>info@nfcinventory.com</p>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '3rem', borderRadius: '32px', display: 'flex', alignItems: 'center', gap: '2rem', border: '1px solid var(--border)', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={32} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--secondary)' }}>Call Support</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>+91 98765 43210</p>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '3rem', borderRadius: '32px', display: 'flex', alignItems: 'center', gap: '2rem', border: '1px solid var(--border)', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={32} color="var(--danger)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--secondary)' }}>Our Headquarters</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>IT Tech Park, Building 4, Mumbai, India</p>
                </div>
              </div>

              {/* Social Links */}
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Find Us Online</h4>
                <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                  {[<Twitter />, <Linkedin />, <Github />].map((icon, i) => (
                    <motion.div 
                      whileHover={{ y: -5, color: 'var(--primary)' }}
                      key={i} 
                      style={{ width: '60px', height: '60px', background: 'white', border: '1px solid var(--border)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: 'var(--secondary)' }}
                    >
                      {icon}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card" 
              style={{ padding: '4.5rem', borderRadius: '40px', background: 'white', border: '1px solid var(--border)', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.08)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--bg-main)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={20} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--secondary)', letterSpacing: '-1px' }}>Message Us Directly</h2>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="input-group">
                  <label>FULL NAME</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    style={{ height: '64px', borderRadius: '16px', background: 'var(--bg-main)', border: 'none', fontWeight: 600 }}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    style={{ height: '64px', borderRadius: '16px', background: 'var(--bg-main)', border: 'none', fontWeight: 600 }}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>HOW CAN WE HELP?</label>
                  <textarea 
                    rows={6} 
                    placeholder="Describe your inquiry..." 
                    value={form.message}
                    onChange={(e) => setForm({...form, message: e.target.value})}
                    style={{ borderRadius: '16px', background: 'var(--bg-main)', border: 'none', fontWeight: 600, resize: 'none' }}
                    required
                  ></textarea>
                </div>
                <button 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ height: '72px', width: '100%', borderRadius: '20px', fontSize: '1.15rem', fontWeight: 800, background: 'var(--secondary)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)' }}
                >
                  {loading ? 'Sending Request...' : 'Transmit Message'} <Send size={20} style={{ marginLeft: '10px' }} />
                </button>
              </form>

              <div style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <HelpCircle size={16} /> FAQs
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <ShieldCheck size={16} /> Data Security
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Map Mockup Placeholder */}
      <section style={{ height: '500px', background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Globe size={180} color="var(--border)" style={{ opacity: 1, position: 'absolute' }} />
             <div style={{ background: 'white', padding: '1.5rem 3rem', borderRadius: '99px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative', zIndex: 1, border: '1px solid var(--border)', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px' }}>
                LOCATING ENGINES...
             </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Contact;
