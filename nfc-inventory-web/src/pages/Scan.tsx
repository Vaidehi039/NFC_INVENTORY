import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { getProductBySku, linkTag, getProducts, productTransaction, nfcScanAction, storeNfcScan, getNfcScans } from '../api';
import { Scan as ScanIcon, Link as LinkIcon, AlertCircle, CheckCircle2, Search, ArrowUpCircle, ArrowDownCircle, Zap, Database, Clock, Wifi } from 'lucide-react';

const Scan: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [isWriting, setIsWriting] = useState(false);
    const [scannedProduct, setScannedProduct] = useState<any>(null);
    const [unknownTagId, setUnknownTagId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedLinkProductId, setSelectedLinkProductId] = useState<string>("");
    const [manualId, setManualId] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [isTransacting, setIsTransacting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAutoPilot, setIsAutoPilot] = useState(() => localStorage.getItem('autoPilot') === 'true');
    const [autoAction, setAutoAction] = useState<'IN' | 'OUT'>(() => (localStorage.getItem('autoAction') as any) || 'OUT');
    const [scanHistory, setScanHistory] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [manualTagInput, setManualTagInput] = useState("");
    const [isProcessingManual, setIsProcessingManual] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                const data = await getProducts(token);
                setProducts(data);
                if (data.length > 0) setSelectedLinkProductId(data[0].id.toString());
            } catch (err) { }
        };
        fetchProducts();
        loadScanHistory();
    }, []);

    useEffect(() => {
        localStorage.setItem('autoPilot', isAutoPilot.toString());
        localStorage.setItem('autoAction', autoAction);
    }, [isAutoPilot, autoAction]);

    // Load scan history from XAMPP MySQL
    const loadScanHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const scans = await getNfcScans(token);
            setScanHistory(scans);
        } catch (err) {
            console.log("Could not load scan history:", err);
        }
    };

    // Store NFC tag data in XAMPP MySQL
    const saveNfcTagToDatabase = async (serialNumber: string, tagData?: string, readerType?: string) => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Not authenticated. Please login again.");
                return null;
            }
            const result = await storeNfcScan(token, serialNumber, tagData, readerType);
            console.log("NFC scan stored in XAMPP MySQL:", result);
            // Refresh scan history
            loadScanHistory();
            return result;
        } catch (err: any) {
            console.error("Failed to store NFC scan:", err);
            setError(`Database error: ${err.message}`);
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    // Process a manually typed NFC Tag ID (no USB reader needed)
    const handleManualTagProcess = async () => {
        const tagId = manualTagInput.trim();
        if (!tagId) return;

        try {
            setIsProcessingManual(true);
            setError(null);
            setSuccessMsg(null);

            // 1. Store the scan in XAMPP MySQL
            await saveNfcTagToDatabase(tagId, 'Manual input', 'manual');

            // 2. Play detection feedback
            playDetectionFeedback();

            // 3. Look up the product by tag_id
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Not authenticated. Please login again.");
                return;
            }

            try {
                const product = await getProductBySku(tagId, token);
                if (product) {
                    setScannedProduct(product);
                    setSuccessMsg(`Tag ${tagId} matched to "${product.name}" — saved to XAMPP MySQL!`);
                    setManualTagInput("");
                } else {
                    setUnknownTagId(tagId);
                    setManualTagInput("");
                }
            } catch {
                // Product not found — show the mapping view
                setUnknownTagId(tagId);
                setManualTagInput("");
            }
        } catch (err: any) {
            setError(`Error processing tag: ${err.message}`);
        } finally {
            setIsProcessingManual(false);
        }
    };

    const playDetectionFeedback = () => {
        // 1. Physical Haptic Feedback (for Android/Mobile)
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        // 2. Digital Beep Sound (Web Audio API)
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const audioCtx = new AudioContextClass();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beep
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);

            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (e) { }
    };

    const handleTransaction = async (action: 'IN' | 'OUT') => {
        if (!scannedProduct || quantity <= 0) return;
        try {
            setIsTransacting(true);
            setError(null);
            const token = localStorage.getItem('token');
            const result = await productTransaction(token, scannedProduct.id, action, quantity);
            setSuccessMsg(result.message);
            // Update local stock display
            setScannedProduct({ ...scannedProduct, stock: result.new_stock });
            setQuantity(1);
        } catch (err: any) {
            setError(err.message || 'Transaction failed');
        } finally {
            setIsTransacting(false);
        }
    };

    // Desktop Hardware Listener (for USB NFC readers acting as keyboards)
    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();
        const handleGlobalKeyDown = async (e: KeyboardEvent) => {
            // Only capture if we are NOT in an input field
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

            if (!isScanning) return;

            const currentTime = Date.now();
            // increased timeout to 100ms for slower readers
            if (currentTime - lastKeyTime > 100) buffer = "";

            if (e.key === 'Enter') {
                if (buffer.length > 0) {
                    console.log("NFC Captured via USB Keyboard Interface:", buffer);
                    // ✅ Store the raw scan data in XAMPP MySQL first
                    await saveNfcTagToDatabase(buffer, undefined, 'usb');
                    // Then look up the product
                    fetchProductBySKU(buffer);
                    buffer = "";
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
            lastKeyTime = currentTime;
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isScanning]);

    const handleRealScan = async () => {
        setError(null); setSuccessMsg(null); setScannedProduct(null); setUnknownTagId(null);
        setIsScanning(true);

        // Web NFC API check (Android Chrome)
        if ('NDEFReader' in window && window.isSecureContext) {
            try {
                // @ts-ignore
                const ndef = new NDEFReader();
                await ndef.scan();
                // @ts-ignore
                ndef.addEventListener("reading", async ({ message, serialNumber }) => {
                    const decoder = new TextDecoder();

                    // Collect all record data as tag_data
                    let tagDataParts: string[] = [];
                    if (message && message.records) {
                        for (const record of message.records) {
                            try {
                                tagDataParts.push(decoder.decode(record.data));
                            } catch { }
                        }
                    }

                    const id = serialNumber || (tagDataParts.length > 0 ? tagDataParts[0] : null);
                    const rawTagData = tagDataParts.join(' | ');

                    if (id) {
                        // ✅ Store the raw NFC scan data in XAMPP MySQL
                        await saveNfcTagToDatabase(id, rawTagData || undefined, 'web_nfc');
                        // Then look up the product
                        await fetchProductBySKU(id);
                    } else {
                        setError("Tag is completely blank. Try manual mapping below.");
                    }
                });
            } catch (err) {
                console.log("Native NFC failed or cancelled. Keyboard fallback active.");
            }
        }
    };

    const handleMapTag = async () => {
        const idToMap = unknownTagId || manualId;
        if (!idToMap || !selectedLinkProductId) {
            setError("Please provide a Tag ID and select a product.");
            return;
        }
        try {
            setIsWriting(true);
            const token = localStorage.getItem('token');
            await linkTag(token, parseInt(selectedLinkProductId), idToMap);
            setSuccessMsg("Tag mapped successfully!");
            setUnknownTagId(null);
            setManualId("");
            fetchProductBySKU(idToMap);
        } catch (err) {
            setError(`Mapping failed: ${err}`);
        } finally {
            setIsWriting(false);
        }
    };

    const fetchProductBySKU = async (sku: string) => {
        setError(null);
        setSuccessMsg(null);
        try {
            const token = localStorage.getItem('token');

            if (isAutoPilot) {
                const result = await nfcScanAction(token, sku, autoAction, quantity);
                setScannedProduct({
                    name: result.product.name,
                    sku: result.product.sku,
                    stock: result.product.new_stock,
                    price: result.product.price,
                    tag_id: sku
                });
                setSuccessMsg(`Auto ${autoAction}: ${result.product.name} (Now: ${result.product.new_stock})`);
            } else {
                const product = await getProductBySku(token, sku);
                setScannedProduct(product);
                setSuccessMsg(`Asset Identified: ${product.name}`);
            }

            playDetectionFeedback();
            setUnknownTagId(null);
        } catch (err: any) {
            if (err.message.includes("not found") || err.message.includes("No product mapped")) {
                setUnknownTagId(sku);
                setScannedProduct(null);
                setError(`Unknown Tag: ${sku}`);
            } else {
                setError(err.message || "Failed to process scan");
            }
        }
    };

    // Auto-clear success and error messages
    useEffect(() => {
        if (successMsg || error) {
            const timer = setTimeout(() => {
                setSuccessMsg(null);
                setError(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [successMsg, error]);

    return (
        <Layout>
            <div className="animate-fade" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>NFC Command Center</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Register hardware tags to your virtual inventory</p>

                {/* AUTO PILOT CONFIG */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '2rem' }}>
                    <div
                        onClick={() => setIsAutoPilot(!isAutoPilot)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '50px',
                            background: isAutoPilot ? 'var(--primary)' : '#f1f5f9',
                            color: isAutoPilot ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer', transition: 'all 0.3s',
                            fontWeight: 700, fontSize: '0.85rem'
                        }}
                    >
                        <Zap size={16} fill={isAutoPilot ? "white" : "none"} />
                        {isAutoPilot ? "AUTO PILOT ON" : "AUTO PILOT OFF"}
                    </div>
                    {isAutoPilot && (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <button
                                onClick={() => setAutoAction('IN')}
                                style={{
                                    padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)',
                                    background: autoAction === 'IN' ? '#16a34a' : 'white',
                                    color: autoAction === 'IN' ? 'white' : 'var(--text-muted)',
                                    fontWeight: 700, fontSize: '0.8rem'
                                }}
                            >IN</button>
                            <button
                                onClick={() => setAutoAction('OUT')}
                                style={{
                                    padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)',
                                    background: autoAction === 'OUT' ? '#dc2626' : 'white',
                                    color: autoAction === 'OUT' ? 'white' : 'var(--text-muted)',
                                    fontWeight: 700, fontSize: '0.8rem'
                                }}
                            >OUT</button>

                            <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Qty:</span>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    style={{ width: '45px', padding: '5px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ background: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', marginBottom: '2rem' }}>

                    {/* SAVING INDICATOR */}
                    {isSaving && (
                        <div style={{
                            padding: '12px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                            borderRadius: '16px', marginBottom: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            animation: 'pulse 1s infinite', border: '1px solid #c7d2fe'
                        }}>
                            <Database size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                                Saving NFC data to XAMPP MySQL...
                            </span>
                        </div>
                    )}

                    {/* SCANNED PRODUCT VIEW */}
                    {scannedProduct && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="animate-slide"
                            style={{ textAlign: 'left' }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(34, 197, 94, 0.05)',
                                borderRadius: '32px',
                                pointerEvents: 'none',
                                animation: 'pulse-bg 1.5s ease-out'
                            }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'relative' }}>
                                <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}>
                                    <CheckCircle2 size={16} /> TAG DETECTED & SAVED
                                </div>
                                <button onClick={() => setScannedProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>New Scan</button>
                            </div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.25rem' }}>{scannedProduct.name}</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 600 }}>SKU Reference: {scannedProduct.sku}</p>

                            <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Hardware Signature</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>{scannedProduct.tag_id || "Legacy Direct SKU Match"}</div>
                            </div>

                            <div style={{
                                padding: '10px 14px', background: '#f0fdf4', borderRadius: '12px',
                                border: '1px solid #bbf7d0', marginBottom: '1.5rem',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <Database size={14} style={{ color: '#16a34a' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                                    ✓ Scan data stored in XAMPP MySQL
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6 }}>AVAILABLE STOCK</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{scannedProduct.stock}</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6 }}>MARKET VALUE</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>₹{scannedProduct.price.toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>TRANSACTION QUANTITY</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <button
                                        disabled={isTransacting}
                                        onClick={() => handleTransaction('IN')}
                                        className="btn btn-primary"
                                        style={{ background: '#16a34a', border: 'none', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <ArrowUpCircle size={20} /> Stock IN
                                    </button>
                                    <button
                                        disabled={isTransacting || scannedProduct.stock < quantity}
                                        onClick={() => handleTransaction('OUT')}
                                        className="btn"
                                        style={{ background: '#dc2626', color: 'white', border: 'none', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <ArrowDownCircle size={20} /> Stock OUT
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* MAPPING VIEW */}
                    {(unknownTagId || manualId) && !scannedProduct && (
                        <div className="animate-slide" style={{ textAlign: 'left' }}>
                            <div style={{ padding: '1.5rem', background: '#fff7ed', borderRadius: '20px', border: '1px solid #ffedd5', marginBottom: '2rem', display: 'flex', gap: '12px' }}>
                                <AlertCircle style={{ color: '#f97316', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 800, color: '#9a3412', fontSize: '0.9rem' }}>NEW TAG DETECTED</div>
                                    <p style={{ fontSize: '0.8rem', color: '#c2410c', opacity: 0.8 }}>This tag ID is not currently linked to any product.</p>
                                </div>
                            </div>

                            <div style={{
                                padding: '10px 14px', background: '#f0fdf4', borderRadius: '12px',
                                border: '1px solid #bbf7d0', marginBottom: '1.5rem',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <Database size={14} style={{ color: '#16a34a' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                                    ✓ Tag scan saved in XAMPP MySQL (unlinked)
                                </span>
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800 }}>Detected Tag ID</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={unknownTagId || manualId}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontWeight: 600 }}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '2.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800 }}>Quick Link - Search Catalog</label>
                                <div style={{ position: 'relative', marginBottom: '10px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        placeholder="Type name or category to filter..."
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ paddingLeft: '40px', background: '#fff', border: '2px solid var(--primary)', borderRadius: '12px' }}
                                    />
                                </div>
                                <select
                                    value={selectedLinkProductId}
                                    onChange={(e) => setSelectedLinkProductId(e.target.value)}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem', size: 5 } as any}
                                    size={5}
                                >
                                    <option value="">-- Select Product --</option>
                                    {products
                                        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(p => (
                                            <option key={p.id} value={p.id}>
                                                [{p.category.toUpperCase()}] {p.name}
                                            </option>
                                        ))
                                    }
                                </select>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    {products.filter(p => !p.tag_id).length} unmapped products remaining in catalog
                                </p>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
                                onClick={handleMapTag}
                                disabled={!selectedLinkProductId || isWriting}
                            >
                                {isWriting ? "Securing Link..." : <><LinkIcon size={18} /> Finalize Connection</>}
                            </button>
                            <button onClick={() => { setUnknownTagId(null); setManualId(""); }} style={{ width: '100%', marginTop: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel & Retry</button>
                        </div>
                    )}

                    {/* INITIAL SCAN VIEW */}
                    {!scannedProduct && !unknownTagId && !manualId && (
                        <>
                            {/* MANUAL TAG ID INPUT — No USB reader needed */}
                            <div style={{
                                background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
                                borderRadius: '20px', border: '2px solid #c7d2fe',
                                padding: '1.5rem', marginBottom: '2rem', textAlign: 'left'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '10px',
                                        background: 'var(--primary)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <ScanIcon size={16} style={{ color: 'white' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Enter NFC Tag ID</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Type or paste the tag number printed on your NFC tag</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={manualTagInput}
                                        onChange={(e) => setManualTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && manualTagInput.trim()) {
                                                handleManualTagProcess();
                                            }
                                        }}
                                        placeholder="e.g. 2190962515"
                                        style={{
                                            flex: 1, padding: '14px 16px', borderRadius: '14px',
                                            border: '2px solid var(--primary)', background: 'white',
                                            fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700,
                                            outline: 'none', letterSpacing: '1px'
                                        }}
                                    />
                                    <button
                                        onClick={handleManualTagProcess}
                                        disabled={!manualTagInput.trim() || isProcessingManual}
                                        className="btn btn-primary"
                                        style={{
                                            padding: '14px 24px', borderRadius: '14px',
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            fontWeight: 800, fontSize: '0.9rem',
                                            opacity: !manualTagInput.trim() ? 0.5 : 1
                                        }}
                                    >
                                        {isProcessingManual ? (
                                            <><Database size={16} style={{ animation: 'pulse 1s infinite' }} /> Processing...</>
                                        ) : (
                                            <><ScanIcon size={16} /> Process Tag</>
                                        )}
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    💡 This will store the scan in XAMPP MySQL, find the linked product, and let you update stock.
                                </p>
                            </div>

                            {/* SCAN BUTTON — for Web NFC / USB reader */}
                            <div
                                onClick={handleRealScan}
                                style={{
                                    width: '160px', height: '160px', background: isScanning ? 'var(--primary-dark)' : 'var(--primary)',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', margin: '0 auto 2rem', cursor: 'pointer',
                                    animation: isScanning ? 'pulse 1.5s infinite' : 'none',
                                    boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.4)',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <ScanIcon size={36} style={{ marginBottom: '6px' }} />
                                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{isScanning ? "Active" : "Scan Now"}</span>
                                <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>Web NFC / USB</span>
                            </div>

                            {isScanning && (
                                <div style={{
                                    padding: '14px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                                    borderRadius: '16px', marginBottom: '1.5rem',
                                    border: '1px solid #c7d2fe',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}>
                                    <Wifi size={16} style={{ color: 'var(--primary)', animation: 'pulse 1s infinite' }} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        Listening for NFC tags... Tap a tag on the reader
                                    </span>
                                </div>
                            )}

                            <div style={{
                                padding: '12px', background: '#f8fafc', borderRadius: '12px',
                                fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center',
                                border: '1px solid var(--border)'
                            }}>
                                <strong>No USB reader?</strong> Just type the Tag ID above and click "Process Tag"
                            </div>
                        </>
                    )}
                </div>

                {error && <div className="animate-slide" style={{ padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '16px', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={18} /> {error}
                </div>}
                {successMsg && <div className="animate-slide" style={{ padding: '1rem', background: '#f0fdf4', color: '#16a34a', borderRadius: '16px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} /> {successMsg}
                </div>}

                {/* NFC SCAN HISTORY FROM XAMPP MySQL */}
                {scanHistory.length > 0 && (
                    <div style={{
                        marginTop: '2rem',
                        background: 'white',
                        borderRadius: '24px',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                        overflow: 'hidden',
                        textAlign: 'left'
                    }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Database size={18} style={{ color: 'var(--primary)' }} />
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Stored NFC Scans</h3>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Data saved in XAMPP MySQL &bull; nfc_scans table</p>
                                </div>
                            </div>
                            <span style={{
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--primary)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>
                                {scanHistory.length} records
                            </span>
                        </div>

                        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {scanHistory.map((scan: any, i: number) => (
                                <div
                                    key={scan.id || i}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        borderBottom: i < scanHistory.length - 1 ? '1px solid #f1f5f9' : 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '36px', height: '36px',
                                            borderRadius: '10px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: scan.status === 'Linked' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        }}>
                                            {scan.status === 'Linked'
                                                ? <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                                                : <ScanIcon size={16} style={{ color: '#f59e0b' }} />
                                            }
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                                {scan.serial_number}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={10} />
                                                {new Date(scan.created_at).toLocaleString()}
                                                <span style={{
                                                    padding: '1px 6px',
                                                    borderRadius: '4px',
                                                    background: '#f1f5f9',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    fontSize: '0.6rem'
                                                }}>
                                                    {scan.reader_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            background: scan.status === 'Linked' ? '#dcfce7' : '#fef3c7',
                                            color: scan.status === 'Linked' ? '#16a34a' : '#d97706',
                                        }}>
                                            {scan.status}
                                        </span>
                                        {scan.product && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                → {scan.product.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Scan;
