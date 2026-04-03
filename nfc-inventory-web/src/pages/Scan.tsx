import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "../components/Layout";
import { 
  Scan as ScanIcon, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search, 
  History,
  X,
  Package,
  TrendingUp,
  Cpu,
  Globe,
  Zap,
  Activity,
  Keyboard
} from "lucide-react";
import { getProductByTagId, storeNfcScan, stockUpdate, getNfcScans } from "../api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const Scan: React.FC = () => {

  const [tagId, setTagId] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScanningMode, setIsScanningMode] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [activePopup, setActivePopup] = useState<"stock" | "details" | null>(null);
  const [lastScanInfo, setLastScanInfo] = useState<{ id: string, time: number } | null>(null);
  
  // Refs for scanner handling (to avoid re-renders during buffered input)
  const scanBuffer = useRef("");
  const lastKeyTime = useRef(0);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  // =========================
  // INITIALIZATION
  // =========================

  useEffect(() => {
    fetchScans();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only process keys if we are in "Scanning Mode"
      if (!isScanningMode) return;

      // Ignore modifiers
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      // USB Scanners send keys extremely fast (usually < 20ms-50ms between keys)
      // If timeDiff > 100ms, it might be manual typing. 
      // We allow the first key to have any timeDiff.
      if (scanBuffer.current.length > 0 && timeDiff > 100) {
        console.log("Manual typing detected or slow scan, resetting buffer");
        scanBuffer.current = "";
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const finalId = scanBuffer.current.trim();
        if (finalId.length >= 3) {
          processScan(finalId);
        } else if (finalId.length > 0) {
          setError("Invalid Tag ID length");
        }
        scanBuffer.current = "";
      } else if (e.key.length === 1) {
        scanBuffer.current += e.key;
      }

      // Auto-reset buffer if no input for 500ms to be safe
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      scanTimeout.current = setTimeout(() => {
        scanBuffer.current = "";
      }, 500);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    const interval = setInterval(fetchScans, 12000); 
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    };
  }, [isScanningMode]);

  const fetchScans = useCallback(async () => {
    try {
      const data = await getNfcScans();
      setRecentScans(data.slice(0, 5));
    } catch (e) {}
  }, []);

  const processScan = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg("Detecting Tag Signal...");

      // Store the scan activity
      await storeNfcScan(id, "NFC Tag", "usb_hardware_reader");
      
      // Fetch product linked to this tag ID
      const data = await getProductByTagId(id);
      
      // SUCCESS: Product identified
      setProduct(data);
      setSuccessMsg(`Product identified: ${data.name}`);
      setIsScanningMode(false);
      fetchScans();

      // DOUBLE-TAP LOGIC
      const now = Date.now();
      if (lastScanInfo && lastScanInfo.id === id && (now - lastScanInfo.time) < 5000) {
        // SECOND TAP: Show Details
        setActivePopup("details");
        setLastScanInfo(null); // Reset
        toast.success("Detailed view opened (Double-tap detected)");
      } else {
        // FIRST TAP: Show Stock Operation
        setActivePopup("stock");
        setLastScanInfo({ id, time: now });
        toast.success("Stock operations ready. Scan again for details.");
      }
    } catch (err: any) {
      console.error("Scan processing failed:", err);
      const msg = err?.response?.data?.detail || "Product not found for this tag.";
      setError(msg);
      toast.error(msg);
      setIsScanningMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (type: "stock" | "details") => {
    if (!product) {
      toast.error("Scan product first");
      return;
    }
    setActivePopup(type);
  };

  const toggleScan = () => {
    if (isScanningMode) {
      setIsScanningMode(false);
      setSuccessMsg(null);
      scanBuffer.current = "";
    } else {
      setIsScanningMode(true);
      setError(null);
      setSuccessMsg("Waiting for NFC tag scan...");
    }
  };

  const handleManualScan = () => {
    if (!tagId) return;
    processScan(tagId);
    setTagId("");
  };

  const handleTransaction = async (action: "IN" | "OUT") => {
    if (!product) return;

    try {
      setLoading(true);
      await stockUpdate(product.id, action, quantity);
      
      const newStock = action === "IN" ? product.stock + quantity : Math.max(0, product.stock - quantity);
      
      setProduct({ ...product, stock: newStock });
      setSuccessMsg(`Stock ${action} Updated Successfully!`);
      toast.success(`Stock ${action} Updated Successfully!`);
      
      // Small delay before closing popup
      setTimeout(() => {
        setActivePopup(null);
        setSuccessMsg(null);
        setQuantity(1);
        fetchScans();
      }, 1500); 
    } catch (err: any) {
      console.error("Transaction failed:", err);
      const msg = err?.response?.data?.detail || "Transaction failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: '1rem' }}>
        
        {/* HERO SECTION */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>
            <Activity size={14} /> USB Reader Mode Active
          </div>
          <h1 style={{ fontSize: '3.2rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-1.5px', color: 'var(--secondary)' }}>
            NFC Web Gateway
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
            Use your USB NFC scanner to manage inventory. Clicking start scan will put the system in listening mode for your hardware reader.
          </p>

          {/* TABS SECTION (Informational only now, as popups trigger on scan) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '3rem' }}>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>
                💡 Tip: Tap tag <span style={{ color: 'var(--primary)' }}>once</span> for stock, <span style={{ color: 'var(--primary)' }}>twice</span> for full details.
             </p>
          </div>
        </motion.header>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) 1fr', gap: '3rem' }}>
          
          {/* LEFT: MAIN SCANNER */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
              
              {/* Background Accent */}
              <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(255,255,255,0) 70%)', zIndex: -1 }}></div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ marginBottom: '2rem', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
              >
                <Keyboard size={20} />
                <span>External USB Reader (Keyboard Wedge) Supported</span>
              </motion.div>

              {/* SCAN BUTTON CONTAINER */}
              <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 3rem' }}>
                <motion.div
                  animate={{ 
                    rotate: isScanningMode ? 360 : 0
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ 
                    position: 'absolute', 
                    top: -10, left: -10, right: -10, bottom: -10, 
                    border: '2px solid transparent',
                    borderTopColor: isScanningMode ? 'var(--primary)' : 'var(--border)',
                    borderRadius: '50%',
                    opacity: 0.5
                  }}
                />
                
                <motion.div 
                  whileHover={!loading ? { scale: 1.05, boxShadow: isScanningMode ? '0 0 80px rgba(99, 102, 241, 0.8)' : '0 15px 35px rgba(0,0,0,0.1)' } : {}}
                  whileTap={!loading ? { scale: 0.95 } : {}}
                  onClick={toggleScan}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '50%', 
                    background: isScanningMode ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: loading ? 'default' : 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isScanningMode ? '0 0 60px rgba(99, 102, 241, 0.6)' : 'var(--shadow-xl)',
                    border: isScanningMode ? 'none' : '1px solid var(--border)',
                    position: 'relative',
                    zIndex: 2,
                    pointerEvents: loading ? 'none' : 'auto',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isScanningMode ? "scanning" : "idle"}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <ScanIcon size={64} color={isScanningMode ? 'white' : 'var(--primary)'} strokeWidth={2.5} />
                    </motion.div>
                  </AnimatePresence>

                  <span style={{ fontSize: '0.8rem', fontWeight: 900, marginTop: '14px', color: isScanningMode ? 'white' : 'var(--text-main)', letterSpacing: '1.2px' }}>
                    {isScanningMode ? "LISTENING..." : "START SCAN"}
                  </span>
                  
                  {isScanningMode && (
                    <>
                      <motion.div 
                        animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%', background: 'var(--primary)', zIndex: -1 }}
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                        transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%', background: 'var(--primary)', zIndex: -1 }}
                      />
                    </>
                  )}
                </motion.div>
              </div>

              <div style={{ maxWidth: '440px', margin: '0 auto' }}>
                <div className="input-group" style={{ position: 'relative' }}>
                  <label style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Backup Entry</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="text" 
                        placeholder="Manual Tag ID ID entry..." 
                        value={tagId}
                        onChange={(e) => setTagId(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleManualScan();
                          }
                        }}
                        style={{ paddingLeft: '48px', height: '56px', borderRadius: '16px', border: '1px solid var(--border)', fontWeight: 600, transition: 'all 0.3s' }}
                      />
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleManualScan}
                      disabled={loading || !tagId}
                      style={{ height: '56px', width: '56px', borderRadius: '16px', padding: 0 }}
                    >
                      <Zap size={20} fill="white" />
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {successMsg && !error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ marginTop: '2rem', color: '#2563eb', background: '#eff6ff', padding: '16px', borderRadius: '16px', fontWeight: 700, fontSize: '0.95rem', border: '1px solid #dbeafe' }}
                  >
                    {isScanningMode ? (
                      <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                         <Activity size={18} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> {successMsg}
                      </motion.div>
                    ) : (
                      <><CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> {successMsg}</>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div style={{ color: 'var(--danger)', background: '#fef2f2', padding: '16px', borderRadius: '16px', fontSize: '0.95rem', fontWeight: 700, marginTop: '2rem', border: '1px solid #fee2e2' }}>
                  <AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> {error}
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT: LIVE FEED */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="glass-card" style={{ height: '100%', borderRadius: '32px', padding: '2rem', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h3 style={{ fontWeight: 900, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <History size={20} color="var(--primary)" />
                  </div>
                  Scan History
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <motion.div 
                    animate={{ opacity: [1, 0.4, 1] }} 
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px' }}>SYNCHRONIZED</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentScans.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <Globe size={48} color="var(--border)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                    <p style={{ fontWeight: 600 }}>Awaiting hardware scan signal...</p>
                  </div>
                ) : recentScans.map((scan, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={scan.id} 
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'white', borderRadius: '20px', border: '1px solid var(--border)', transition: 'transform 0.2s', cursor: 'default' }}
                    whileHover={{ scale: 1.02, boxShadow: '0 10px 20px -10px rgba(0,0,0,0.1)' }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                      <Cpu size={20} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.product?.name || "Unknown Tag"}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>{scan.serial_number}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>USB SCAN</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>

        {/* POPUP MODAL FOR STOCK OPERATIONS */}
        <AnimatePresence>
          {activePopup === 'stock' && product && (
            <div 
              onClick={() => setActivePopup(null)}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: 'white', width: '100%', maxWidth: '540px', borderRadius: '32px', padding: '2.5rem', boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: '20px', color: 'white' }}>
                      <TrendingUp size={32} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px', color: '#0f172a', marginBottom: '4px' }}>
                        {product.name || "Unknown Product"}
                      </h2>
                      <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 700 }}>
                         SKU: <span style={{ color: 'var(--primary)' }}>{product.sku || "N/A"}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePopup(null)} 
                    style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={20} color="var(--text-muted)" />
                  </button>
                </div>

                <div className="input-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '12px', display: 'block', textAlign: 'center' }}>ADJUST QUANTITY</label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--secondary)', color: 'white', border: 'none', fontSize: '1.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}
                    >
                      −
                    </motion.button>
                    
                    <div style={{ padding: '0 20px', minWidth: '80px', textAlign: 'center' }}>
                       <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary)', lineHeight: 1 }}>{quantity}</div>
                       <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px' }}>UNITS</div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--secondary)', color: 'white', border: 'none', fontSize: '1.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}
                    >
                      +
                    </motion.button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn" 
                    onClick={() => handleTransaction("IN")}
                    disabled={loading}
                    style={{ flex: 1, background: '#10b981', color: 'white', borderRadius: '20px', height: '64px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    <ArrowUpCircle size={22} /> STOCK IN
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn"
                    onClick={() => handleTransaction("OUT")}
                    disabled={loading}
                    style={{ flex: 1, background: '#ef4444', color: 'white', borderRadius: '20px', height: '64px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    <ArrowDownCircle size={22} /> STOCK OUT
                  </motion.button>
                </div>

                {successMsg && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '2rem', color: '#16a34a', background: '#f0fdf4', padding: '16px', borderRadius: '16px', textAlign: 'center', fontWeight: 800, border: '1px solid #dcfce7' }}
                  >
                    <CheckCircle2 size={18} style={{ marginRight: '10px' }} /> {successMsg}
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* POPUP MODAL FOR FULL DETAILS */}
        <AnimatePresence>
          {activePopup === 'details' && product && (
            <div 
              onClick={() => setActivePopup(null)}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '32px', padding: '3rem', boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Product Specifications</h2>
                  <button onClick={() => setActivePopup(null)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', height: '40px', width: '40px', borderRadius: '12px' }}>
                    <X size={20} color="var(--text-muted)" />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Product Name</span>
                    <span style={{ fontWeight: 800 }}>{product.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>NFC Tag ID</span>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{product.tag_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Current Inventory</span>
                    <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>{product.stock} units</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Item Category</span>
                    <span style={{ fontWeight: 800, background: '#f1f5f9', padding: '4px 12px', borderRadius: '8px' }}>{product.category}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Market Price</span>
                    <span style={{ fontWeight: 800 }}>₹{product.price}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Last Scan Sync</span>
                    <span style={{ fontWeight: 800, color: '#16a34a' }}>Live (Real-time)</span>
                  </div>
                </div>

                <button 
                  onClick={() => setActivePopup(null)}
                  style={{ width: '100%', marginTop: '3rem', padding: '16px', borderRadius: '16px', background: 'var(--secondary)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                >
                  Close Details
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </Layout>
  );
};

export default Scan;