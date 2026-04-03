import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    ScrollView,
    Vibration,
    Platform,
    Modal
} from 'react-native';
import { theme } from '../styles/theme';
import { getProductByTag, storeNfcScan, productTransaction, updateProduct, deleteProduct, quickScan, createProduct, getDashboardStats } from '../api';
import { Nfc, CheckCircle2, AlertCircle, Database, Package, ArrowUp, ArrowDown, Search, Wifi, Edit3, Trash2, Save, PlusCircle, ArrowLeft } from 'lucide-react-native';

let NfcManager: any = null;
let NfcEvents: any = null;
let NfcTech: any = null;
let nfcAvailable = false;

if (Platform.OS !== 'web') {
    try {
        const nfcModule = require('react-native-nfc-manager');
        NfcManager = nfcModule.default;
        NfcEvents = nfcModule.NfcEvents;
        NfcTech = nfcModule.NfcTech;
        nfcAvailable = true;
    } catch (e) {
        console.warn('react-native-nfc-manager not available:', e);
        nfcAvailable = false;
    }
}

const ScanScreen = ({ navigation, route }: any) => {
    const [scanState, setScanState] = useState<'IDLE' | 'WAITING' | 'PROCESSING' | 'ERROR'>('IDLE');
    
    // ... rest ...
    useEffect(() => {
        if (route?.params?.autoAdd) {
            setIsAddingNew(true);
        }
    }, [route?.params]);
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [scannedProduct, setScannedProduct] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isTransacting, setIsTransacting] = useState(false);
    const [nfcInitialized, setNfcInitialized] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [lastScannedTag, setLastScannedTag] = useState('');
    const [manualTagId, setManualTagId] = useState('');
    const [quantity, setQuantity] = useState(1);
    
    // Missing states for editing/deleting
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'STOCK' | 'DETAILS' | null>(null);
    const [lastScanInfo, setLastScanInfo] = useState<{ id: string, time: number } | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    
    // Missing states for adding new product
    const [newProductName, setNewProductName] = useState('');
    const [newProductSku, setNewProductSku] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductStock, setNewProductStock] = useState('');
    
    // Validation states
    const [invalidFields, setInvalidFields] = useState<string[]>([]);
    
    // Missing state for simulation logic and general saving feedback
    const [isScanning, setIsScanning] = useState(false);

    const isActiveRef = useRef(false);

    useEffect(() => {
        if (!nfcAvailable) return;

        const initNfc = async () => {
            try {
                // First check if NFC is actually supported by the hardware
                const supported = await NfcManager.isSupported();
                if (supported) {
                    await NfcManager.start();
                    setNfcInitialized(true);
                } else {
                    setNfcInitialized(false);
                }
            } catch (ex) {
                console.warn('NFC init failed:', ex);
                setNfcInitialized(false);
            }
        };

        initNfc();

        return () => {
            stopNfcScan();
        };
    }, []);

    const fetchLiveScans = async () => {
        try {
            const data = await getDashboardStats();
            setRecentScans(data?.scans || []);
        } catch (e) {}
    };

    useFocusEffect(
        useCallback(() => {
            fetchLiveScans();
            const interval = setInterval(fetchLiveScans, 5000);
            return () => clearInterval(interval);
        }, [])
    );

    const startNfcScan = async () => {
        // 1. Prevent concurrent sessions
        if (scanState !== 'IDLE' && scanState !== 'ERROR') return;
        
        if (!nfcAvailable) {
            setError('NFC hardware not detected.');
            setScanState('ERROR');
            return;
        }

        try {
            // 2. Clear UI state
            setError(null);
            setSuccessMsg(null);
            setScannedProduct(null);
            setScanState('WAITING');

            // 3. Initialize & Cleanup previous hardware state
            await NfcManager.start().catch(() => 0);
            await NfcManager.cancelTechnologyRequest().catch(() => 0);
            
            console.log("NFC: Starting NDEF hardware session...");
            
            // 4. Request NDEF Technology (This blocks execution until a physical tag is tapped)
            // No popup can trigger until this line resolves from hardware.
            await NfcManager.requestTechnology(NfcTech.Ndef);
            
            // 5. Read the Tag ID from the detected hardware
            const tag = await NfcManager.getTag();
            console.log("NFC: Tag ID received:", tag?.id);
            
            // 6. Validation: If no tag or ID read, do nothing
            if (tag && tag.id) {
                // Success feedback (Physical vibration)
                try { Vibration.vibrate([0, 100]); } catch (_) {}
                
                setScanState('PROCESSING'); 
                
                // 7. Backend API Call: Send Tag ID and retrieve product info
                await processTag(tag.id.toString(), 'mobile_nfc');
            } else {
                setScanState('IDLE');
            }
        } catch (ex: any) {
            console.warn('Strict NFC Error:', ex);
            if (ex === 'User cancel' || ex?.message?.includes('User cancel')) {
                // Silent reset for intentional cancellation
            } else {
                setError('NFC Access Failed. Please tap again.');
                setScanState('ERROR');
            }
        } finally {
            // 8. Always cancel hardware request and release sensor
            await NfcManager.cancelTechnologyRequest().catch(() => 0);
            setScanState('IDLE');
        }
    };

    const stopNfcScan = async () => {
        try {
            await NfcManager.cancelTechnologyRequest().catch(() => 0);
        } finally {
            setScanState('IDLE');
        }
    };

    const simulateScan = () => {
        setIsScanning(true);
        setSuccessMsg("Simulation Started...");
        setError(null);

        setTimeout(() => {
            setIsScanning(false);
            const demoTag = '2190962515';
            processTag(demoTag, 'mobile_simulation');
        }, 1500);
    };

    const processTag = async (id: string, readerType: string) => {
        let trimmedId = id.trim();
        
        // Global override: Replace the old ID with the requested demo ID
        if (trimmedId === '536F9782520001') {
            trimmedId = '2190962515';
        }

        if (!trimmedId) {
            setError('Please enter a valid Tag ID.');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            setSuccessMsg(null);

            // STEP 3: Call backend API POST /api/nfc-scan to get product details
            // This ensures we only use a single API call for both logging and data retrieval
            const response = await storeNfcScan(trimmedId, 'Tag Lookup', readerType);
            
            if (!response || !response.product) {
                // If product is not found, offer to add it later
                setLastScannedTag(trimmedId);
                setError("Tag recognized, but no product linked yet.");
                setIsAddingNew(true);
                return;
            }

            const data = response.product;

            // Force ID 2190962515 for iPhone 15 Pro Max as requested in demo
            let displayId = trimmedId;
            if (data.name?.includes('iPhone 15') || data.sku?.includes('15')) {
                displayId = '2190962515';
            }

            setScannedProduct({
                ...data,
                tag_id: displayId,
                stock: data.stock,
                price: data.price
            });
            setEditName(data.name);
            setEditPrice(data.price?.toString() || '0');
            
            // STEP 4: Reset scan state first so the UI is clean
            setScanState('IDLE');
            await NfcManager.cancelTechnologyRequest().catch(() => 0);
            
            // DOUBLE-TAP LOGIC
            const now = Date.now();
            if (lastScanInfo && lastScanInfo.id === trimmedId && (now - lastScanInfo.time) < 5000) {
                // SECOND TAP: Show Details
                setActiveTab('DETAILS');
                setLastScanInfo(null);
                setSuccessMsg("Details view (Double-tap)");
                if (Platform.OS !== 'web') Vibration.vibrate([0, 50, 50, 50]);
            } else {
                // FIRST TAP: Show Stock
                setActiveTab('STOCK');
                setLastScanInfo({ id: trimmedId, time: now });
                setSuccessMsg("Stock mode. Tap again for details.");
            }
            
            setIsEditing(false);
            setIsModalVisible(true);
            fetchLiveScans();
        } catch (err: any) {
            console.error('Process tag error:', err);
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail || err.message || 'Could not reach server.';

            if (status === 404) {
                // If it's the demo simulation tag, just auto-create a mock product
                if (trimmedId === '2190962515') {
                    try {
                        setIsSaving(true);
                        const demoProduct = await createProduct({
                            name: "iPhone 15 Pro Max",
                            sku: "IPH-15-MAX",
                            category: "Mobile",
                            price: 149999,
                            stock: 25,
                            tag_id: '2190962515'
                        });
                        setScannedProduct(demoProduct);
                        setSuccessMsg("iPhone 15 Pro Max demo product created!");
                        fetchLiveScans();
                    } catch (e) {
                        setError("Failed to auto-create demo product.");
                    } finally {
                        setIsSaving(false);
                    }
                } else {
                    // If product not found, offer to add it
                    setLastScannedTag(trimmedId);
                    setError("Tag recognized, but no product linked yet.");
                    setIsAddingNew(true);
                }
            } else {
                setError(detail);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleTransaction = async (action: 'IN' | 'OUT') => {
        if (!scannedProduct) return;
        try {
            setIsTransacting(true);
            
            // Ensure we use the target ID for iPhone 15 Pro Max transactions
            const targetId = (scannedProduct.name?.includes('iPhone 15')) ? '2190962515' : scannedProduct.tag_id;
            
            const result = await productTransaction(targetId, action, quantity);
            
            // Log the movement specifically with the requested ID
            storeNfcScan('2190962515', `STOCK ${action}: ${scannedProduct.name}`, 'mobile_transaction').catch(() => 0);
            
            const newStock = result?.product?.new_stock ?? result?.new_stock;
            setScannedProduct({ ...scannedProduct, stock: newStock ?? scannedProduct.stock });
            setSuccessMsg(`Stock ${action} successful!`);
            fetchLiveScans();
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Transaction failed.');
        } finally {
            setIsTransacting(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!scannedProduct) return;
        try {
            setIsSaving(true);
            const updated = await updateProduct(scannedProduct.id, {
                name: editName,
                price: parseFloat(editPrice)
            });
            setScannedProduct(updated);
            setIsEditing(false);
            setSuccessMsg("Product updated!");
        } catch (err: any) {
            setError(err.message || "Failed to update product");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!scannedProduct) return;
        Alert.alert(
            "Delete Product",
            `Delete "${scannedProduct.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await deleteProduct(scannedProduct.id);
                            setScannedProduct(null);
                            setSuccessMsg("Product deleted.");
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCreateProduct = async () => {
        setInvalidFields([]);
        if (!newProductName || !newProductSku || !newProductCategory) {
            setError("⚠️ Please enter product details (Name, SKU, and Category).");
            const missing = [];
            if (!newProductName) missing.push('name');
            if (!newProductSku) missing.push('sku');
            if (!newProductCategory) missing.push('category');
            setInvalidFields(missing);
            Vibration.vibrate(500);
            return;
        }

        const nameVal = newProductName.trim();
        const skuVal = newProductSku.trim();

        // 🕵️ ANTI-SPAM VALIDATION
        const spamRegex = /(.)\1{3,}/;           // 4+ redundant chars
        const entireRepeatRegex = /^([a-zA-Z0-9])\1+$/; // Full repetition
        const triplePatternRegex = /(.+)\1{2,}/; // Repeated patterns like ghghgh

        if (spamRegex.test(nameVal) || entireRepeatRegex.test(nameVal) || triplePatternRegex.test(nameVal)) {
            setError("❌ Invalid product name. Please enter a valid name");
            setInvalidFields(['name']);
            Vibration.vibrate([0, 200, 100, 200]);
            return;
        }

        if (nameVal.length < 3 || nameVal.length > 15) {
            setError("❌ Product name must be 3–15 characters");
            setInvalidFields(['name']);
            Vibration.vibrate(500);
            return;
        }

        // 🏷️ CATEGORY VALIDATION
        const categoryVal = newProductCategory.trim();
        const categoryRegex = /^[A-Za-z ]+$/;
        const doubleVowelRegex = /[aeiouAEIOU].*[aeiouAEIOU]/;
        const alternatingRegex = /^([a-zA-Z]{1,2})\1+$/;
        const ALLOWED_CATS = ["Electronics", "Clothing", "Grocery", "Stationery", "Accessories"];

        if (!categoryRegex.test(categoryVal) || !doubleVowelRegex.test(categoryVal) || 
            spamRegex.test(categoryVal) || alternatingRegex.test(categoryVal) ||
            categoryVal.length < 3 || categoryVal.length > 20 || !ALLOWED_CATS.includes(categoryVal)) {
            setError("❌ Invalid category name");
            setInvalidFields(['category']);
            Vibration.vibrate(500);
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            setSuccessMsg(null);

            const product = await createProduct({
                name: newProductName,
                sku: newProductSku,
                category: newProductCategory,
                price: parseFloat(newProductPrice) || 0,
                stock: parseInt(newProductStock) || 0,
                tag_id: lastScannedTag
            });

            setScannedProduct(product);
            setIsAddingNew(false);
            setSuccessMsg("✅ Product created and linked!");
            // Reset fields
            setNewProductName('');
            setNewProductSku('');
            setNewProductCategory('');
            setNewProductPrice('');
            setNewProductStock('0');
            setInvalidFields([]);
        } catch (err: any) {
            console.error('Create error:', err);
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail;

            if (status === 403) {
                // RESTRICTED OR NOT ALLOWED
                setError(`❌ Invalid product. ${detail || 'You are not allowed to add this item.'}`);
                Vibration.vibrate([0, 200, 100, 200]);
                
                // Identify which field to highlight based on message
                const fields = [];
                const msg = detail?.toLowerCase() || '';
                if (msg.includes('category')) fields.push('category');
                if (msg.includes('name')) fields.push('name');
                if (msg.includes('sku')) fields.push('sku');
                // If it's a generic "restricted" error without specific field, highlight all crucial ones
                if (fields.length === 0) setInvalidFields(['category', 'name', 'sku']);
                else setInvalidFields(fields);

            } else if (status === 400 && detail?.includes('exists')) {
                setError("⚠️ Product already exists with this SKU.");
                setInvalidFields(['sku']);
                Vibration.vibrate(300);
            } else {
                setError(detail || err.message || "Failed to create product");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {error ? (
                <View style={styles.errorBox}>
                    <AlertCircle color={theme.colors.danger} size={18} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {/* SCANNING INSTRUCTION */}
            <View style={{ marginBottom: 20 }}>
                <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>
                    💡 Tap tag <Text style={{ color: theme.colors.primary }}>once</Text> for stock, <Text style={{ color: theme.colors.primary }}>twice</Text> for details.
                </Text>
            </View>

            {successMsg ? (
                <View style={styles.successBox}>
                    <CheckCircle2 color={theme.colors.accent} size={18} />
                    <Text style={styles.successText}>{successMsg}</Text>
                </View>
            ) : null}

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.productCard}>
                        {activeTab === 'STOCK' ? (
                            <View style={styles.stockBadge}>
                                <Database color={theme.colors.primary} size={16} />
                                <Text style={styles.stockBadgeText}>STOCK MANAGEMENT</Text>
                            </View>
                        ) : (
                            <View style={styles.successBadge}>
                                <CheckCircle2 color={theme.colors.accent} size={16} />
                                <Text style={styles.successBadgeText}>SPECIFICATIONS</Text>
                            </View>
                        )}

                        {activeTab === 'STOCK' ? (
                            /* STOCK TAB CONTENT */
                            <View style={styles.actionSection}>
                                <Text style={styles.productName}>{scannedProduct?.name || "Unknown Product"}</Text>
                                <Text style={styles.productSkuLabel}>SKU: <Text style={{color: theme.colors.primary}}>{scannedProduct?.sku || "N/A"}</Text></Text>
                                <Text style={styles.currentStockText}>In Stock: {scannedProduct?.stock} units</Text>
                                
                                <View style={{ marginVertical: 30, backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                    <Text style={styles.actionTitle}>ADJUST QUANTITY</Text>
                                    <View style={styles.qtyRow}>
                                        <TouchableOpacity 
                                            onPress={() => {
                                                const newQty = Math.max(1, quantity - 1);
                                                setQuantity(newQty);
                                                try { Vibration.vibrate(50); } catch(_) {}
                                            }} 
                                            style={styles.qtyBtn}
                                        >
                                            <Text style={styles.qtyBtnText}>−</Text>
                                        </TouchableOpacity>
                                        
                                        <View style={{ alignItems: 'center', minWidth: 60 }}>
                                            <Text style={styles.qtyText}>{quantity}</Text>
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.textMuted }}>UNITS</Text>
                                        </View>

                                        <TouchableOpacity 
                                            onPress={() => {
                                                setQuantity(quantity + 1);
                                                try { Vibration.vibrate(50); } catch(_) {}
                                            }} 
                                            style={styles.qtyBtn}
                                        >
                                            <Text style={styles.qtyBtnText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.btnRow}>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.accent }]} onPress={() => handleTransaction('IN')} disabled={!!isTransacting}>
                                            {isTransacting ? <ActivityIndicator color="white" size="small" animating={true} /> : <><ArrowUp color="white" size={18} /><Text style={styles.btnText}>STOCK IN</Text></>}
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.danger }]} onPress={() => handleTransaction('OUT')} disabled={!!isTransacting}>
                                            {isTransacting ? <ActivityIndicator color="white" size="small" animating={true} /> : <><ArrowDown color="white" size={18} /><Text style={styles.btnText}>STOCK OUT</Text></>}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            /* DETAILS TAB CONTENT */
                            <View style={styles.detailsSection}>
                                <Text style={styles.productName}>{scannedProduct?.name}</Text>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>NFC TAG ID</Text>
                                    <Text style={styles.detailValue}>{scannedProduct?.tag_id}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>CATEGORY</Text>
                                    <Text style={styles.detailValue}>{scannedProduct?.category}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>UNIT PRICE</Text>
                                    <Text style={styles.detailValue}>₹{scannedProduct?.price}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>TOTAL STOCK</Text>
                                    <Text style={[styles.detailValue, {color: theme.colors.primary, fontWeight: '900'}]}>{scannedProduct?.stock} Units</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>STATUS</Text>
                                    <Text style={[styles.detailValue, {color: '#16a34a'}]}>Verified</Text>
                                </View>
                            </View>
                        )}

                        {successMsg && !isTransacting && activeTab === 'STOCK' && (
                            <View style={styles.inlineSuccess}>
                                <CheckCircle2 color="#16a34a" size={14} />
                                <Text style={styles.inlineSuccessText}>{successMsg}</Text>
                            </View>
                        )}
                        
                        <TouchableOpacity 
                            style={styles.closeModalBtn} 
                            onPress={() => { 
                                setIsModalVisible(false); 
                                setActiveTab(null);
                                setSuccessMsg(null);
                            }}
                        >
                            <Text style={styles.closeModalBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Text style={styles.title}>NFC Gateway</Text>
            <View style={styles.scanArea}>
                <TouchableOpacity 
                    style={[styles.pulse, scanState === 'WAITING' ? styles.pulseActive : {}]} 
                    onPress={scanState === 'WAITING' ? stopNfcScan : startNfcScan} 
                    activeOpacity={0.8}
                >
                    <Nfc color="white" size={48} />
                    <Text style={styles.scanBtnText}>
                        {scanState === 'WAITING' ? 'Stop' : (scanState === 'PROCESSING' ? 'Reading...' : 'Scan NFC')}
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.scanningStatus}>
                {scanState === 'WAITING' ? '📶 Waiting for NFC tag...' : 
                 scanState === 'PROCESSING' ? '🔄 Syncing with backend...' : 'READY TO SCAN'}
            </Text>

            {(isSaving || isTransacting) ? <View style={styles.savingOverlay}><ActivityIndicator color={theme.colors.primary} animating={true} /><Text style={styles.savingText}>Processing...</Text></View> : null}

            {isAddingNew && (
                <View style={[styles.productCard, { marginTop: 24, paddingVertical: 20 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <PlusCircle color={theme.colors.primary} size={24} />
                        <Text style={[styles.productName, { marginLeft: 10 }]}>Register New Product</Text>
                    </View>
                    <Text style={styles.editLabel}>Tag ID: {lastScannedTag}</Text>

                    <Text style={[styles.editLabel, invalidFields.includes('name') && { color: theme.colors.danger }]}>Product Name</Text>
                    <TextInput 
                        style={[styles.editInput, invalidFields.includes('name') && { borderColor: theme.colors.danger, borderWidth: 2 }]} 
                        value={newProductName} 
                        onChangeText={setNewProductName} 
                        placeholder="e.g. MacBook Pro" 
                        onFocus={() => setInvalidFields(prev => prev.filter(f => f !== 'name'))}
                        maxLength={15}
                    />

                    <Text style={[styles.editLabel, invalidFields.includes('sku') && { color: theme.colors.danger }]}>SKU</Text>
                    <TextInput 
                        style={[styles.editInput, invalidFields.includes('sku') && { borderColor: theme.colors.danger, borderWidth: 2 }]} 
                        value={newProductSku} 
                        onChangeText={setNewProductSku} 
                        placeholder="e.g. LAP-001" 
                        onFocus={() => setInvalidFields(prev => prev.filter(f => f !== 'sku'))}
                    />

                    <Text style={[styles.editLabel, invalidFields.includes('category') && { color: theme.colors.danger }]}>Category *</Text>
                    <TextInput 
                        style={[styles.editInput, invalidFields.includes('category') && { borderColor: theme.colors.danger, borderWidth: 2 }]} 
                        value={newProductCategory} 
                        onChangeText={setNewProductCategory} 
                        placeholder="e.g. Electronics" 
                        onFocus={() => setInvalidFields(prev => prev.filter(f => f !== 'category'))}
                        maxLength={20}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.editLabel}>Price</Text>
                            <TextInput style={styles.editInput} value={newProductPrice} onChangeText={setNewProductPrice} keyboardType="numeric" placeholder="0.00" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.editLabel}>Initial Stock</Text>
                            <TextInput style={styles.editInput} value={newProductStock} onChangeText={setNewProductStock} keyboardType="numeric" placeholder="0" />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleCreateProduct}>
                        <Text style={styles.saveBtnText}>Register Product</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10, backgroundColor: '#f8fafc' }]} onPress={() => { setIsAddingNew(false); setInvalidFields([]); setError(null); }}>
                        <Text style={styles.cancelBtnText}>Dismiss</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            <TouchableOpacity style={[styles.dashboardBtn, {marginTop: 20}]} onPress={() => navigation.navigate('Dashboard')}>
                <ArrowLeft color={theme.colors.textMuted} size={18} />
                <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
            <View style={styles.feedContainer}>
                <View style={styles.feedHeader}>
                    <Text style={styles.feedTitle}>Live Scan Feed</Text>
                    <Text style={styles.realTime}>REAL-TIME</Text>
                </View>
                {recentScans.length === 0 && (
                    <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 10 }}>No scans found yet.</Text>
                )}
                {recentScans.slice(0, 5).map((scan, index) => {
                    const timeStr = scan.created_at ? new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const productName = scan.product?.name || 'Unlinked Tag';
                    const tagIdText = scan.serial_number || 'No ID';

                    return (
                        <View key={index} style={styles.scanItem}>
                            <View style={styles.scanItemIcon}>
                                <Search size={20} color='white' />
                            </View>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={styles.scanItemTitle} numberOfLines={1}>{productName}</Text>
                                <Text style={styles.scanItemSub}>ID: {tagIdText}</Text>
                            </View>
                            <Text style={styles.scanTime}>{timeStr}</Text>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 24, alignItems: 'center', backgroundColor: theme.colors.bgMain, flexGrow: 1 },
    title: { fontSize: 28, fontWeight: '900', color: theme.colors.secondary, marginBottom: 40 },
    scanArea: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
    pulse: { width: 140, height: 140, borderRadius: 70, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    pulseActive: { backgroundColor: theme.colors.danger },
    scanBtnText: { color: 'white', fontWeight: '900', marginTop: 8, fontSize: 13 },
    scanningStatusContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    scanningText: { color: theme.colors.primary, fontWeight: '700' },
    savingOverlay: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: 'white', borderRadius: 14, marginBottom: 20 },
    savingText: { color: theme.colors.secondary, fontWeight: '600' },
    manualEntry: { width: '100%', padding: 22, backgroundColor: 'white', borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, marginTop: 20 },
    manualTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
    manualInputRow: { flexDirection: 'row', gap: 10 },
    manualInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12 },
    manualBtn: { width: 50, height: 50, backgroundColor: theme.colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    manualBtnDisabled: { backgroundColor: theme.colors.border },
    simulateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.accent, padding: 12, borderRadius: 12, marginBottom: 20, gap: 8, marginTop: 10 },
    simulateBtnText: { color: 'white', fontWeight: '700' },
    productCard: { width: '100%', backgroundColor: 'white', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border },
    successBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
    successBadgeText: { fontSize: 10, fontWeight: '900', color: theme.colors.accent },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    productName: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 6, textAlign: 'center' },
    productSkuLabel: { color: '#64748b', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
    currentStockText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    utilityBtns: { flexDirection: 'row', gap: 8 },
    utilBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    stockInfo: { marginBottom: 24 },
    stockLabel: { fontSize: 16, fontWeight: '700' },
    priceTag: { color: theme.colors.primary, fontWeight: '800', fontSize: 18 },
    actionSection: { marginTop: 16, width: '100%' },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 25, justifyContent: 'center', marginBottom: 25 },
    qtyBtn: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 },
    qtyBtnText: { fontSize: 28, fontWeight: '700', color: 'white' },
    qtyText: { fontSize: 32, fontWeight: '900', color: '#0f172a', lineHeight: 36 },
    btnRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
    btnText: { color: 'white', fontWeight: '800' },
    resetBtn: { marginTop: 24, padding: 10, alignItems: 'center' },
    resetBtnText: { color: theme.colors.primary, fontWeight: '700', fontSize: 16 },
    dashboardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 5, padding: 10 },
    dashboardBtnText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 14 },
    feedContainer: { width: '100%', marginTop: 30, paddingBottom: 20 },
    feedHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    feedTitle: { fontSize: 18, fontWeight: '700' },
    realTime: { color: theme.colors.primary, fontWeight: '700', fontSize: 12 },
    scanItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    scanItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    scanItemTitle: { fontWeight: '800', fontSize: 13, color: '#0f172a', marginBottom: 2 },
    scanItemSub: { color: '#64748b', fontSize: 11, fontWeight: '600' },
    scanTime: { color: theme.colors.primary, fontWeight: '700', fontSize: 12 },
    editForm: { marginBottom: 20 },
    editLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    editInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10, marginBottom: 12 },
    editActions: { flexDirection: 'row', gap: 10 },
    saveBtn: { flex: 1, height: 44, backgroundColor: theme.colors.primary, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    saveBtnText: { color: 'white', fontWeight: '700' },
    cancelBtn: { flex: 1, height: 44, backgroundColor: '#f1f5f9', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cancelBtnText: { fontWeight: '700' },
    errorBox: { width: '100%', padding: 12, backgroundColor: '#fee2e2', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    errorText: { color: theme.colors.danger, fontWeight: '600', flex: 1 },
    successBox: { width: '100%', padding: 12, backgroundColor: '#d1fae5', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    successText: { color: theme.colors.accent, fontWeight: '600', flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    closeModalBtn: { marginTop: 20, padding: 15, backgroundColor: theme.colors.primary, borderRadius: 12, alignItems: 'center' },
    closeModalBtnText: { color: 'white', fontWeight: '800' },
    productTag: { fontSize: 10, color: theme.colors.textMuted, marginTop: 4 },
    actionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 15, color: theme.colors.secondary, textAlign: 'center' },
    scanningStatus: { marginTop: 10, color: theme.colors.textMuted, fontWeight: '700', fontSize: 12, textAlign: 'center' },
    devToolsHeader: { marginTop: 30, padding: 10 },
    devToolsTitle: { color: '#cbd5e1', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    devToolsContainer: { width: '100%', padding: 20, backgroundColor: '#f8fafc', borderRadius: 12, marginTop: 10 },
    tabBtn: { flex: 1, height: 56, backgroundColor: 'white', borderRadius: 16, borderColor: theme.colors.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    tabBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabBtnText: { fontWeight: '800', color: theme.colors.secondary, fontSize: 13 },
    detailsSection: { marginTop: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    detailLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 0.5 },
    detailValue: { fontSize: 14, fontWeight: '700', color: theme.colors.secondary },
    stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    stockBadgeText: { fontSize: 10, fontWeight: '900', color: theme.colors.primary },
    inlineSuccess: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, marginTop: 20 },
    inlineSuccessText: { color: '#16a34a', fontWeight: '700', fontSize: 12 },
});

export default ScanScreen;
