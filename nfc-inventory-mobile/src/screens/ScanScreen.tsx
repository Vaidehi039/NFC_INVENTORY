import React, { useState, useEffect, useRef } from 'react';
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
    Platform
} from 'react-native';
import { theme } from '../styles/theme';
import { getProductByTag, storeNfcScan, productTransaction, updateProduct, deleteProduct, quickScan, createProduct } from '../api';
import { Nfc, CheckCircle2, AlertCircle, Database, Package, ArrowUp, ArrowDown, Search, Wifi, Edit3, Trash2, Save, PlusCircle } from 'lucide-react-native';

let NfcManager: any = null;
let NfcEvents: any = null;
let nfcAvailable = false;

if (Platform.OS !== 'web') {
    try {
        const nfcModule = require('react-native-nfc-manager');
        NfcManager = nfcModule.default;
        NfcEvents = nfcModule.NfcEvents;
        nfcAvailable = true;
    } catch (e) {
        console.warn('react-native-nfc-manager not available:', e);
        nfcAvailable = false;
    }
}

const ScanScreen = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [scannedProduct, setScannedProduct] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [manualTagInput, setManualTagInput] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isTransacting, setIsTransacting] = useState(false);
    const [nfcInitialized, setNfcInitialized] = useState(false);

    // Edit states
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit states
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');

    // Add Product states
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductSku, setNewProductSku] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('Electronics');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductStock, setNewProductStock] = useState('0');
    const [lastScannedTag, setLastScannedTag] = useState('');

    const isActiveRef = useRef(false);

    useEffect(() => {
        if (!nfcAvailable) return;

        const initNfc = async () => {
            try {
                await NfcManager.start();
                setNfcInitialized(true);
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

    const startNfcScan = async () => {
        if (!nfcAvailable || !nfcInitialized) {
            setError(
                'NFC is not available on this device or platform.\nPlease use the Manual Gateway below to look up a tag.'
            );
            return;
        }

        try {
            setIsScanning(true);
            setError(null);
            setSuccessMsg(null);
            setScannedProduct(null);
            isActiveRef.current = true;

            // Use the more compatible event-listener approach
            NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag: any) => {
                if (!isActiveRef.current) return;

                try { Vibration.vibrate(100); } catch (_) { }

                const tagId = tag?.id;

                if (tagId) {
                    isActiveRef.current = false;
                    await stopNfcScan();
                    processTag(tagId.toString(), 'mobile_nfc');
                } else {
                    setError('Could not read tag ID. Please try again.');
                    await stopNfcScan();
                }
            });

            await NfcManager.registerTagEvent();
        } catch (ex: any) {
            console.warn('NFC Scan start error:', ex);
            setError(ex.message || 'Failed to start NFC scan. Please try again.');
            setIsScanning(false);
            isActiveRef.current = false;
        }
    };

    const stopNfcScan = async () => {
        isActiveRef.current = false;
        setIsScanning(false);
        if (nfcAvailable && NfcEvents) {
            try {
                NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
                await NfcManager.unregisterTagEvent().catch(() => 0);
            } catch (e) { /* ignore */ }
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
        const trimmedId = id.trim();
        if (!trimmedId) {
            setError('Please enter a valid Tag ID.');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            setSuccessMsg(null);

            storeNfcScan(trimmedId, 'Mobile Scan Detected', readerType).catch(() => 0);

            // Use the 'proper' decrement-on-scan endpoint
            const data = await quickScan(trimmedId);

            if (data.error) {
                setError(data.error);
                // Even if not found, let's try to lookup for info
                const fallbackProduct = await getProductByTag(trimmedId).catch(() => null);
                if (fallbackProduct) {
                    setScannedProduct(fallbackProduct);
                    setEditName(fallbackProduct.name);
                    setEditPrice(fallbackProduct.price.toString());
                    setIsEditing(false);
                }
            } else {
                // Success: update UI with the decremented stock
                setScannedProduct({
                    ...data,
                    tag_id: trimmedId,
                    stock: data.remaining_stock,
                    price: data.price
                });
                setEditName(data.name);
                setEditPrice(data.price.toString());
                setSuccessMsg(`Scan Successful! Remaining: ${data.remaining_stock}`);
                setIsEditing(false);
            }
        } catch (err: any) {
            console.error('Process tag error:', err);
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail || err.message || 'Could not reach server.';

            if (status === 404) {
                // If product not found, offer to add it
                setLastScannedTag(trimmedId);
                setError("Tag recognized, but no product linked yet.");
                setIsAddingNew(true);
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
            const result = await productTransaction(scannedProduct.tag_id, action, quantity);
            const newStock = result?.product?.new_stock ?? result?.new_stock;
            setScannedProduct({ ...scannedProduct, stock: newStock ?? scannedProduct.stock });
            setSuccessMsg(`Stock ${action} successful!`);
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
        if (!newProductName || !newProductSku) {
            setError("Name and SKU are required.");
            return;
        }
        try {
            setIsSaving(true);
            setError(null);
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
            setSuccessMsg("Product created and linked!");
            // Reset fields
            setNewProductName('');
            setNewProductSku('');
            setNewProductPrice('');
            setNewProductStock('0');
        } catch (err: any) {
            setError(err.message || "Failed to create product");
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

            {successMsg ? (
                <View style={styles.successBox}>
                    <CheckCircle2 color={theme.colors.accent} size={18} />
                    <Text style={styles.successText}>{successMsg}</Text>
                </View>
            ) : null}

            {scannedProduct ? (
                <View style={styles.productCard}>
                    <View style={styles.successBadge}>
                        <CheckCircle2 color={theme.colors.accent} size={16} />
                        <Text style={styles.successBadgeText}>SYNCED</Text>
                    </View>

                    {isEditing === true ? (
                        <View style={styles.editForm}>
                            <Text style={styles.editLabel}>Name</Text>
                            <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} />
                            <Text style={styles.editLabel}>Price</Text>
                            <TextInput style={styles.editInput} value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" />
                            <View style={styles.editActions}>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                                    <Save color="white" size={18} />
                                    <Text style={styles.saveBtnText}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <View style={styles.productHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productName}>{scannedProduct.name}</Text>
                                    <Text style={styles.productSku}>SKU: {scannedProduct.sku}</Text>
                                </View>
                                <View style={styles.utilityBtns}>
                                    <TouchableOpacity style={styles.utilBtn} onPress={() => setIsEditing(true)}>
                                        <Edit3 color={theme.colors.primary} size={20} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.utilBtn, { backgroundColor: '#fee2e2' }]} onPress={handleDeleteProduct}>
                                        <Trash2 color={theme.colors.danger} size={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.stockInfo}>
                                <Text style={styles.stockLabel}>Stock: {scannedProduct.stock} units</Text>
                                <Text style={styles.priceTag}>₹{scannedProduct.price}</Text>
                            </View>
                        </>
                    )}

                    <View style={styles.actionSection}>
                        <View style={styles.qtyRow}>
                            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                            <Text style={styles.qtyText}>{quantity}</Text>
                            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
                        </View>
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.accent }]} onPress={() => handleTransaction('IN')} disabled={isTransacting === true}>
                                {isTransacting === true ? <ActivityIndicator color="white" size="small" /> : <><ArrowUp color="white" size={18} /><Text style={styles.btnText}>IN</Text></>}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.danger }]} onPress={() => handleTransaction('OUT')} disabled={isTransacting === true}>
                                {isTransacting === true ? <ActivityIndicator color="white" size="small" /> : <><ArrowDown color="white" size={18} /><Text style={styles.btnText}>OUT</Text></>}
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.resetBtn} onPress={() => { setScannedProduct(null); setSuccessMsg(null); setError(null); }}><Text style={styles.resetBtnText}>Next Item</Text></TouchableOpacity>
                </View>
            ) : (
                <>
                    <Text style={styles.title}>NFC Gateway</Text>
                    <View style={styles.scanArea}>
                        <TouchableOpacity style={[styles.pulse, (isScanning === true) ? styles.pulseActive : {}]} onPress={isScanning === true ? stopNfcScan : startNfcScan} activeOpacity={0.8}>
                            <Nfc color="white" size={48} />
                            <Text style={styles.scanBtnText}>{isScanning === true ? 'Stop' : 'Scan NFC'}</Text>
                        </TouchableOpacity>
                    </View>

                    {!nfcAvailable || !nfcInitialized || Platform.OS === 'web' ? (
                        <TouchableOpacity style={styles.simulateBtn} onPress={simulateScan} disabled={isScanning === true || isSaving === true}>
                            <Wifi color="white" size={18} /><Text style={styles.simulateBtnText}>Simulate Scan</Text>
                        </TouchableOpacity>
                    ) : null}

                    {isScanning === true ? <View style={styles.scanningStatus}><ActivityIndicator color={theme.colors.primary} /><Text style={styles.scanningText}>Scanning...</Text></View> : null}
                    {isSaving === true ? <View style={styles.savingOverlay}><ActivityIndicator color={theme.colors.primary} /><Text style={styles.savingText}>Processing...</Text></View> : null}

                    <View style={styles.manualEntry}>
                        <Text style={styles.manualTitle}>Manual Gateway</Text>
                        <View style={styles.manualInputRow}>
                            <TextInput style={styles.manualInput} placeholder="Tag ID" value={manualTagInput} onChangeText={setManualTagInput} />
                            <TouchableOpacity style={[styles.manualBtn, ((!manualTagInput.trim()) || (isSaving === true)) ? styles.manualBtnDisabled : {}]} onPress={() => processTag(manualTagInput, 'mobile_manual')} disabled={!manualTagInput.trim() || isSaving === true}>
                                {isSaving === true ? <ActivityIndicator color="white" /> : <Search color="white" size={20} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {isAddingNew && (
                        <View style={[styles.productCard, { marginTop: 24, paddingVertical: 20 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <PlusCircle color={theme.colors.primary} size={24} />
                                <Text style={[styles.productName, { marginLeft: 10 }]}>Register New Product</Text>
                            </View>
                            <Text style={styles.editLabel}>Tag ID: {lastScannedTag}</Text>

                            <Text style={styles.editLabel}>Product Name</Text>
                            <TextInput style={styles.editInput} value={newProductName} onChangeText={setNewProductName} placeholder="e.g. MacBook Pro" />

                            <Text style={styles.editLabel}>SKU</Text>
                            <TextInput style={styles.editInput} value={newProductSku} onChangeText={setNewProductSku} placeholder="e.g. LAP-001" />

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
                            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={() => setIsAddingNew(false)}>
                                <Text style={styles.cancelBtnText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
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
    scanningStatus: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    scanningText: { color: theme.colors.primary, fontWeight: '700' },
    savingOverlay: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: 'white', borderRadius: 14, marginBottom: 20 },
    savingText: { color: theme.colors.secondary, fontWeight: '600' },
    manualEntry: { width: '100%', padding: 22, backgroundColor: 'white', borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border },
    manualTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
    manualInputRow: { flexDirection: 'row', gap: 10 },
    manualInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12 },
    manualBtn: { width: 50, height: 50, backgroundColor: theme.colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    manualBtnDisabled: { backgroundColor: theme.colors.border },
    simulateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.accent, padding: 12, borderRadius: 12, marginBottom: 20, gap: 8 },
    simulateBtnText: { color: 'white', fontWeight: '700' },
    productCard: { width: '100%', backgroundColor: 'white', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border },
    successBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
    successBadgeText: { fontSize: 10, fontWeight: '900', color: theme.colors.accent },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    productName: { fontSize: 20, fontWeight: '800' },
    productSku: { color: theme.colors.textMuted, fontSize: 12 },
    utilityBtns: { flexDirection: 'row', gap: 8 },
    utilBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    stockInfo: { marginBottom: 24 },
    stockLabel: { fontSize: 16, fontWeight: '700' },
    priceTag: { color: theme.colors.primary, fontWeight: '800', fontSize: 18 },
    actionSection: { marginTop: 16 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20, justifyContent: 'center', marginBottom: 20 },
    qtyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    qtyBtnText: { fontSize: 20, fontWeight: '700' },
    qtyText: { fontSize: 20, fontWeight: '800' },
    btnRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
    btnText: { color: 'white', fontWeight: '800' },
    resetBtn: { marginTop: 24, alignItems: 'center' },
    resetBtnText: { color: theme.colors.textMuted, fontWeight: '600' },
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
});

export default ScanScreen;
