import React, { useState, useEffect, useCallback } from "react";
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
  TrendingUp
} from "lucide-react";
import { getProductBySku, storeNfcScan, productTransaction, getNfcScans } from "../api";

const Scan: React.FC = () => {

  const [tagId, setTagId] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScanningMode, setIsScanningMode] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  // =========================
  // FETCH RECENT SCANS
  // =========================

  const fetchScans = useCallback(async () => {
    try {
      const data = await getNfcScans();
      setRecentScans(data.slice(0, 5)); // Show top 5
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchScans();
    const interval = setInterval(fetchScans, 5000);
    return () => clearInterval(interval);
  }, [fetchScans]);

  // =========================
  // HANDLE SCAN
  // =========================

  const processScan = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      // 1. Store scan record
      await storeNfcScan(id, "web input", "web_browser");

      // 2. Fetch product details
      const data = await getProductBySku(id);
      
      setProduct(data);
      setSuccessMsg(`Product Linked: ${data.name}`);
      setIsScanningMode(false); // Stop pulse once found
      fetchScans();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Tag not linked to any product.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = () => {
    if (!tagId) return;
    processScan(tagId);
  };

  // =========================
  // STOCK TRANSACTION
  // =========================

  const handleTransaction = async (action: "IN" | "OUT") => {
    if (!product) return;

    try {
      setLoading(true);
      await productTransaction(product.id, action, quantity);
      
      // Update local product state
      setProduct({
        ...product,
        stock: action === "IN" ? product.stock + quantity : Math.max(0, product.stock - quantity)
      });

      setSuccessMsg(`Stock ${action} Updated Successfully!`);
      setTimeout(() => setProduct(null), 2000); // Close popup after success
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="animate-fade" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-1px' }}>
            NFC Gateway
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Enter Tag ID or start Real-time Monitoring
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
          
          {/* LEFT: MAIN SCANNER */}
          <div>
            <div className="table-container" style={{ padding: '3rem', textAlign: 'center', background: 'white' }}>
              
              <div 
                onClick={() => setIsScanningMode(!isScanningMode)}
                style={{ 
                  width: '160px', 
                  height: '160px', 
                  borderRadius: '50%', 
                  background: isScanningMode ? 'var(--primary)' : '#f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 2rem',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isScanningMode ? '0 0 40px rgba(99, 102, 241, 0.4)' : 'none',
                  animation: isScanningMode ? 'pulse 2s infinite' : 'none',
                  border: isScanningMode ? 'none' : '2px dashed var(--border)'
                }}
              >
                <ScanIcon size={48} color={isScanningMode ? 'white' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '8px', color: isScanningMode ? 'white' : 'var(--text-muted)' }}>
                  {isScanningMode ? "LISTENING..." : "START SCAN"}
                </span>
              </div>

              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <div className="input-group">
                  <label>Manual Tag Entry</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. 2190962515" 
                      value={tagId}
                      onChange={(e) => setTagId(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button 
                      className="btn btn-primary" 
                      onClick={handleManualScan}
                      disabled={loading}
                    >
                      <Search size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ color: 'var(--danger)', background: '#fee2e2', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, marginTop: '1rem' }}>
                  <AlertCircle size={14} style={{ marginRight: '8px' }} /> {error}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: LIVE FEED */}
          <div>
            <div className="table-container" style={{ height: '100%', background: 'white', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} color="var(--primary)" /> Live Scan Feed
                </h3>
                <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800 }}>REAL-TIME</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentScans.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>No recent activity</p>
                ) : recentScans.map((scan) => (
                  <div key={scan.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <ScanIcon size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{scan.product?.name || "Unknown Tag"}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{scan.serial_number}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* POPUP MODAL FOR PRODUCT */}
        {product && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="animate-slide" style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px' }}>
                    <Package size={28} color="var(--primary)" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{product.name}</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SKU: {product.sku}</span>
                  </div>
                </div>
                <button onClick={() => setProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={24} color="var(--text-muted)" />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center' }}>
                  <TrendingUp size={20} color="var(--accent)" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{product.stock}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>CURRENT STOCK</div>
                </div>
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center' }}>
                   <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>DEMO PRICE</div>
                   <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{product.price}</div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PER UNIT</div>
                </div>
              </div>

              <div className="input-group">
                <label>Update Quantity</label>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))} 
                  min="1" 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn" 
                  onClick={() => handleTransaction("IN")}
                  style={{ flex: 1, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', height: '56px' }}
                >
                  <ArrowUpCircle size={20} /> STOCK IN
                </button>
                <button 
                  className="btn"
                  onClick={() => handleTransaction("OUT")}
                  style={{ flex: 1, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', height: '56px' }}
                >
                  <ArrowDownCircle size={20} /> STOCK OUT
                </button>
              </div>

              {successMsg && (
                <div style={{ marginTop: '1.5rem', color: '#16a34a', background: '#dcfce7', padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} style={{ marginRight: '8px' }} /> {successMsg}
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
      `}</style>
    </Layout>
  );
};

export default Scan;