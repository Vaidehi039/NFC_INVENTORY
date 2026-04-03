import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import { Target, Lightbulb, Zap, ArrowRight, ShieldCheck, Globe, Star } from 'lucide-react';

const About: React.FC = () => {
    return (
        <PublicLayout>
            {/* Header Section */}
            <section style={{ padding: '8rem 2rem 6rem', background: '#fff', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-3px', background: 'linear-gradient(135deg, #0f172a 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Our Origins & Vision
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '3rem', fontWeight: 500 }}>
                            We set out with a simple goal: Resolve the complexity of high-stakes asset tracking with an intuitive, hardware-integrated solution.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Introduction Card */}
            <section style={{ padding: '4rem 2rem', background: 'var(--bg-main)' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="glass-card" style={{ padding: '6rem', borderRadius: '40px', background: 'white', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-1.5px' }}>The Project Intro</h2>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                                    The **NFC Based Inventory Management System** was born from a need for real-time visibility in warehouse dynamics. Traditional barcode systems are slow, prone to wear, and require line-of-sight. 
                                </p>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.1rem' }}>
                                    By leveraging **Near Field Communication (NFC)**, we’ve created a system that is resilient, incredibly fast, and works seamlessly with existing enterprise mobile devices.
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: '24px', textAlign: 'center' }}>
                                    <Zap size={32} color="var(--primary)" style={{ marginBottom: '1.25rem' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>100%</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>WIRELESS</div>
                                </div>
                                <div style={{ background: 'var(--primary)', padding: '2rem', borderRadius: '24px', textAlign: 'center', color: 'white' }}>
                                    <ShieldCheck size={32} color="white" style={{ marginBottom: '1.25rem' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>SECURE</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>PROTOCOLS</div>
                                </div>
                                <div style={{ background: 'var(--secondary)', padding: '2rem', borderRadius: '24px', textAlign: 'center', color: 'white' }}>
                                    <Globe size={32} color="white" style={{ marginBottom: '1.25rem' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>LIVE</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>SYNC</div>
                                </div>
                                <div style={{ background: 'white', border: '1px solid var(--border)', padding: '2rem', borderRadius: '24px', textAlign: 'center' }}>
                                    <Star size={32} color="var(--warning)" style={{ marginBottom: '1.25rem' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>AWARD</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>WINNING UI</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision Section */}
            <section style={{ padding: '8rem 2rem', background: 'white' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
                    
                    {/* Mission */}
                    <div className="glass-card" style={{ padding: '4rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '2rem', border: '1px solid var(--border)' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target size={32} color="var(--primary)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Our Mission</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem', fontWeight: 500 }}>
                                To replace outdated, slow inventory processes with modern, hardware-accelerated intelligence that puts control back into the hands of operators.
                            </p>
                        </div>
                    </div>

                    {/* Vision */}
                    <div className="glass-card" style={{ padding: '4rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '2rem', border: '1px solid var(--border)' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lightbulb size={32} color="var(--accent)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Our Vision</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem', fontWeight: 500 }}>
                                A world where zero items are lost, zero time is wasted, and every asset in a supply chain is visible through a unified, elegant interface.
                            </p>
                        </div>
                    </div>

                  </div>
              </div>
            </section>

             {/* Problem/Solution Section */}
             <section style={{ padding: '10rem 2rem', background: 'var(--secondary)', color: 'white' }}>
                 <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '5rem', letterSpacing: '-2px' }}>The Core Value Proposition</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                        {[
                          { p: 'The manual data entry bottleneck slows down large operations.', s: 'Instant NDEF scanning allows for contactless entry in under 1 second per item.' },
                          { p: 'High operational costs from miscounted or missing hardware assets.', s: 'Persistent database synchronization ensures a single source of truth at all times.' },
                          { p: 'Clunky, complex desktop software that requires hours of training.', s: 'Minimal, intuitive user experience designed for effortless use on tablets and phones.' }
                        ].map((item, i) => (
                           <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '2rem' }}>
                              <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{item.p}</div>
                              <div style={{ padding: '8px', background: 'var(--primary)', borderRadius: '50%' }}><ArrowRight size={20} /></div>
                              <div style={{ textAlign: 'left', fontWeight: 800, color: 'var(--accent)', fontSize: '1.25rem' }}>{item.s}</div>
                           </div>
                        ))}
                    </div>
                 </div>
             </section>

             <style>{`
                .glass-card { background: white; }
             `}</style>
        </PublicLayout>
    );
};

export default About;
