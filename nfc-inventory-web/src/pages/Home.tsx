import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Database, 
  BarChart3, 
  ShieldCheck, 
  Smartphone, 
  TrendingUp, 
  ArrowRight
} from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      title: 'Precision NFC Tracking',
      desc: 'Achieve 100% accuracy in stock identification with industry-standard NFC technology.',
      icon: <Zap size={24} color="var(--primary)" fill="rgba(99, 102, 241, 0.1)" />
    },
    {
      title: 'Real-time Synchronization',
      desc: 'Seamlessly sync data across web and mobile platforms with zero latency using our cloud infrastructure.',
      icon: <Database size={24} color="var(--primary)" fill="rgba(99, 102, 241, 0.1)" />
    },
    {
      title: 'Interactive Analytics',
      desc: 'Visualize your inventory trends, stock health, and personnel activity with high-fidelity charts.',
      icon: <BarChart3 size={24} color="var(--primary)" fill="rgba(99, 102, 241, 0.1)" />
    },
    {
      title: 'Enterprise Security',
      desc: 'Protect your valuable assets with robust authentication and granular validation protocols.',
      icon: <ShieldCheck size={24} color="var(--primary)" fill="rgba(99, 102, 241, 0.1)" />
    },
    {
      title: 'Cross-Platform Harmony',
      desc: 'Experience a unified ecosystem across tablets, smartphones, and desktop environments.',
      icon: <Smartphone size={24} color="var(--primary)" fill="rgba(99, 102, 241, 0.1)" />
    },
    {
      title: 'Velocity Insights',
      desc: 'Monitor stock movement velocity to optimize your supply chain and reduce overhead.',
      icon: <TrendingUp size={24} color="var(--primary)" fill="rgba(99, 102, 241, 0.1)" />
    }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        padding: '8rem 2rem 10rem', 
        overflow: 'hidden',
        textAlign: 'center',
        background: '#fff'
      }}>
        {/* Abstract Background Blur (Optimized) */}
        <div style={{ position: 'absolute', top: '10%', right: '0%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(30px)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: '0%', left: '0%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(30px)', zIndex: 0 }}></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '2.5rem' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid var(--border)', borderRadius: '99px', padding: '10px 24px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '1.5px', boxShadow: 'var(--shadow-md)' }}>
              <Zap size={16} fill="var(--primary)" /> Smart Inventory Control
            </div>
            <h1 style={{ fontSize: '4.5rem', fontWeight: 900, color: 'var(--secondary)', lineHeight: 1.1, letterSpacing: '-3px', marginBottom: '1.75rem', background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Precision Intelligence <br /> for Modern Logistics
            </h1>
            <p style={{ fontSize: '1.35rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto', fontWeight: 500 }}>
              The definitive platform for real-time asset tracking and stock management. Optimize your supply chain with hardware-integrated NFC intelligence.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}
          >
            <Link to="/login" className="btn btn-primary" style={{ height: '64px', padding: '0 40px', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)', border: 'none', boxShadow: '0 20px 40px -10px rgba(67, 56, 202, 0.4)' }}>
              Explore Platform <ArrowRight size={20} />
            </Link>
          </motion.div>

          {/* Simple Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: '6rem', position: 'relative' }}
          >
            <div className="glass-card" style={{ borderRadius: '40px', padding: '10px', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bbb65181ef9b?auto=format&fit=crop&w=800&q=60" 
                alt="Dashboard Preview" 
                style={{ width: '100%', borderRadius: '32px', display: 'block', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }} 
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats / Proof Section */}
      <section style={{ background: 'var(--secondary)', color: 'white', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', textAlign: 'center' }}>
          {[
            { label: 'Tracking Accuracy', val: '99.9%' },
            { label: 'Detection Speed', val: '0.2s' },
            { label: 'Active Endpoints', val: '1,500+' },
            { label: 'Data Latency', val: '< 15ms' }
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--accent)' }}>{stat.val}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '10rem 2rem', background: 'var(--bg-main)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '1.25rem', color: 'var(--secondary)' }}>Next-Gen Capabilities</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>
              Engineered for reliability. Built for speed. Our multi-faceted system handles the heavy lifting of inventory management.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {features.map((feat, i) => (
              <motion.div 
                whileHover={{ translateY: -10 }}
                key={i} 
                style={{ background: 'white', padding: '3rem', borderRadius: '30px', border: '1px solid var(--border)', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div style={{ width: '56px', height: '56px', background: 'var(--bg-main)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--secondary)' }}>{feat.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, fontWeight: 500 }}>{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System Explanation Section */}
      <section style={{ padding: '8rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', alignItems: 'center', gap: '6rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '2px', background: 'var(--primary)' }}></div> SYSTEM CORE
            </div>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-1.5px', color: 'var(--secondary)' }}>Unified Workflow Management</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Each physical asset is tagged with a unique NFC serial identifier. When scanned, the system instantly cross-references our high-velocity database to provide real-time updates on stock levels, historical movement, and ownership.
            </p>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              Our Aura Gateway proprietary technology ensures that scans are processed securely, preventing unauthorized data interception and maintaining the integrity of your entire supply chain.
            </p>
            <Link to="/about" className="btn" style={{ fontWeight: 800, color: 'var(--primary)', paddingLeft: 0, gap: '12px' }}>
              Explore Our Technology <ArrowRight size={20} />
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(255,255,255,0) 60%)', zIndex: 0 }}></div>
             <img 
               src="https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=600&q=60" 
               alt="NFC Scanning" 
               style={{ width: '100%', borderRadius: '40px', position: 'relative', zIndex: 1, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }} 
             />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '8rem 2rem' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
          borderRadius: '50px', 
          padding: '6rem 2rem',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, background: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-2px' }}>Ready to Scale Your Operations?</h2>
            <p style={{ fontSize: '1.25rem', marginBottom: '3rem', opacity: 0.9, maxWidth: '640px', margin: '0 auto 3rem' }}>
              Join hundreds of enterprises that trust NFC Inventory for their high-stakes logistics and tracking needs.
            </p>
            <Link to="/register" className="btn" style={{ background: 'white', color: 'var(--primary)', height: '64px', padding: '0 44px', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 800 }}>
              Create Your FREE Account <Zap size={18} fill="currentColor" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
