import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getProducts, addProduct, deleteProduct, updateProduct } from '../api';
import { Edit2, Trash2, Plus, Search, Package, Wifi, WifiOff, Database, CheckCircle2, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Products: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [savingProduct, setSavingProduct] = useState(false);
    const userRole = localStorage.getItem('role') || 'staff';
    const canAddProduct = userRole === 'admin' || userRole === 'superadmin';
    const canEditProduct = userRole === 'manager' || userRole === 'admin' || userRole === 'superadmin';
    const canDeleteProduct = userRole === 'admin' || userRole === 'superadmin';

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Auto-fetch products handled by useEffect above

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        const tagId = (formData.get('tag_id') as string)?.trim() || null;

        const name = (formData.get('name') as string)?.trim();
        const sku = (formData.get('sku') as string)?.trim();
        const category = (formData.get('category') as string)?.trim();

        // 🕵️ FRONTEND VALIDATION
        const spamRegex = /(.)\1{3,}/;
        const entireRepeatRegex = /^([a-zA-Z0-9])\1+$/;
        const triplePatternRegex = /(.+)\1{2,}/; // Catches ghghgh, abcabcabc

        if (spamRegex.test(name) || entireRepeatRegex.test(name) || triplePatternRegex.test(name)) {
            toast.error("Invalid product name. Please enter a valid name");
            return;
        }

        if (name.length < 3 || name.length > 50) {
            toast.error("Product name must be 3–50 characters");
            return;
        }

        const productData: any = {
            name: name,
            sku: sku,
            category: category,
            stock_in: parseInt(formData.get('stock_in') as string) || 0,
            stock_out: parseInt(formData.get('stock_out') as string) || 0,
            purchase_price: parseFloat(formData.get('purchase_price') as string) || 0,
            selling_price: parseFloat(formData.get('selling_price') as string) || 0,
        };

        // 🏷️ CATEGORY VALIDATION
        const categoryRegex = /^[A-Za-z ]+$/;
        const doubleVowelRegex = /[aeiouAEIOU].*[aeiouAEIOU]/;
        const alternatingRegex = /^([a-zA-Z]{1,2})\1+$/;
        const ALLOWED_CATS = ["Electronics", "Clothing", "Grocery", "Stationery", "Accessories"];

        if (!categoryRegex.test(category) || !doubleVowelRegex.test(category) || 
            spamRegex.test(category) || alternatingRegex.test(category) ||
            category.length < 3 || category.length > 50 || !ALLOWED_CATS.includes(category)) {
            toast.error("Invalid category name");
            return;
        }

        // Only include tag_id if provided
        if (tagId) {
            productData.tag_id = tagId;
        }

        try {
            setSavingProduct(true);
            const result = await addProduct(productData);
            setShowAddModal(false);
            toast.success("Product added successfully");
            fetchProducts();
        } catch (err: any) {
            toast.error('Failed to add product');
        } finally {
            setSavingProduct(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        const tagId = (formData.get('tag_id') as string)?.trim() || null;

        const name = (formData.get('name') as string)?.trim();
        const category = (formData.get('category') as string)?.trim();

        // 🕵️ FRONTEND VALIDATION
        const spamRegex = /(.)\1{3,}/;
        const entireRepeatRegex = /^([a-zA-Z0-9])\1+$/;
        const triplePatternRegex = /(.+)\1{2,}/;

        if (spamRegex.test(name) || entireRepeatRegex.test(name) || triplePatternRegex.test(name)) {
            toast.error("Invalid product name. Please enter a valid name");
            return;
        }

        if (name.length < 3 || name.length > 50) {
            toast.error("Product name must be 3–50 characters");
            return;
        }

        const productData: any = {
            name: name,
            category: category,
            stock_in: parseInt(formData.get('stock_in') as string) || 0,
            stock_out: parseInt(formData.get('stock_out') as string) || 0,
            purchase_price: parseFloat(formData.get('purchase_price') as string) || 0,
            selling_price: parseFloat(formData.get('selling_price') as string) || 0,
        };

        // 🏷️ CATEGORY VALIDATION
        const categoryRegex = /^[A-Za-z ]+$/;
        const doubleVowelRegex = /[aeiouAEIOU].*[aeiouAEIOU]/;
        const alternatingRegex = /^([a-zA-Z]{1,2})\1+$/;
        const ALLOWED_CATS = ["Electronics", "Clothing", "Grocery", "Stationery", "Accessories"];

        if (!categoryRegex.test(category) || !doubleVowelRegex.test(category) || 
            spamRegex.test(category) || alternatingRegex.test(category) ||
            category.length < 3 || category.length > 50 || !ALLOWED_CATS.includes(category)) {
            toast.error("Invalid category name");
            return;
        }

        // Include tag_id (can update/clear it)
        if (tagId !== null) {
            productData.tag_id = tagId || null;
        }

        try {
            setSavingProduct(true);
            await updateProduct(editingProduct.id, productData);
            setEditingProduct(null);
            toast.success("Product updated successfully");
            fetchProducts();
        } catch (err: any) {
            toast.error('Failed to update product');
        } finally {
            setSavingProduct(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteProduct(id);
            toast.success("Product deleted successfully");
            fetchProducts();
        } catch (err: any) {
            toast.error('Failed to delete product');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const nfcLinkedCount = products.filter(p => p.tag_id).length;
    const unlinkedCount = products.filter(p => !p.tag_id).length;

    return (
        <Layout>
            <div className="animate-fade">
                <header style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ minWidth: '200px' }}>
                        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Product Catalog</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage your inventory items and stock levels</p>
                    </div>
                    {canAddProduct && (
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ whiteSpace: 'nowrap' }}>
                            <Plus size={18} style={{ marginRight: '8px' }} /> Add New Product
                        </button>
                    )}
                </header>

                {/* Status messages handled by toasts */}

                {/* NFC STATS BAR */}
                <div style={{
                    display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap'
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 18px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                        border: '1px solid #c7d2fe', fontSize: '0.8rem', fontWeight: 700
                    }}>
                        <Database size={14} style={{ color: 'var(--primary)' }} />
                        <span style={{ color: 'var(--primary)' }}>{products.length} Products in MySQL</span>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 18px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '1px solid #bbf7d0', fontSize: '0.8rem', fontWeight: 700
                    }}>
                        <Wifi size={14} style={{ color: '#16a34a' }} />
                        <span style={{ color: '#16a34a' }}>{nfcLinkedCount} NFC Tagged</span>
                    </div>
                    {unlinkedCount > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            border: '1px solid #fcd34d', fontSize: '0.8rem', fontWeight: 700
                        }}>
                            <WifiOff size={14} style={{ color: '#d97706' }} />
                            <span style={{ color: '#d97706' }}>{unlinkedCount} Awaiting NFC Link</span>
                        </div>
                    )}
                </div>

                <div className="table-container">
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', background: '#fcfdfe' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search by name or SKU..."
                                style={{ 
                                    width: '100%', 
                                    paddingLeft: '48px', 
                                    height: '50px',
                                    borderRadius: '16px',
                                    background: 'white',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                                }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <table style={{ minWidth: '1350px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '280px' }}>Item Details</th>
                                <th style={{ width: '140px' }}>Category</th>
                                <th>P. Price</th>
                                <th>S. Price</th>
                                <th style={{ color: '#16a34a' }}>Stock In</th>
                                <th style={{ color: '#dc2626' }}>Stock Out</th>
                                <th style={{ width: '120px' }}>Remaining</th>
                                <th>Total Stock</th>
                                <th style={{ color: '#16a34a' }}>Profit Earned</th>
                                <th style={{ width: '160px' }}>NFC Connection</th>
                                {(canEditProduct || canDeleteProduct) && <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '3rem' }}>Loading catalog...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={12} style={{ textAlign: 'center', padding: '4rem' }}>
                                        <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                        <p style={{ color: 'var(--text-muted)' }}>No products match your search</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.map((product) => (
                                <tr key={product.id} className="table-row-hover">
                                    <td style={{ maxWidth: '280px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                width: '40px', height: '40px', borderRadius: '12px', 
                                                background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--primary)', fontWeight: 800
                                            }}>
                                                {product.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    fontWeight: 800, color: '#1e293b',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                                                }} title={product.name}>
                                                    {product.name}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '0.7rem', color: '#64748b', fontWeight: 600,
                                                    fontFamily: 'monospace', opacity: 0.8
                                                }}>
                                                    {product.sku}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '140px' }}>
                                        <span style={{ 
                                            fontSize: '0.75rem', fontWeight: 700, color: '#475569',
                                            padding: '4px 10px', background: '#f1f5f9', borderRadius: '20px'
                                        }}>
                                            {product.category}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>₹{product.purchase_price.toLocaleString('en-IN')}</td>
                                    <td style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>₹{product.selling_price.toLocaleString('en-IN')}</td>
                                    <td>
                                        <div style={{ 
                                            padding: '4px 12px', background: '#f0fdf4', color: '#16a34a', 
                                            borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', display: 'inline-block'
                                        }}>
                                            +{product.stock_in}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ 
                                            padding: '4px 12px', background: '#fef2f2', color: '#dc2626', 
                                            borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', display: 'inline-block'
                                        }}>
                                            -{product.stock_out}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${product.remaining_stock < 10 ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                                            {product.remaining_stock}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: '#64748b' }}>{product.total_stock}</td>
                                    <td>
                                        <div style={{ 
                                            color: '#16a34a', fontWeight: 900, fontSize: '0.95rem',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            ₹{product.profit.toLocaleString('en-IN')}
                                        </div>
                                    </td>
                                    <td>
                                        {product.tag_id ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    background: '#16a34a', boxShadow: '0 0 6px rgba(22, 163, 74, 0.4)'
                                                }}></div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a' }}>
                                                    Linked
                                                </span>
                                                <span style={{
                                                    fontSize: '0.6rem', fontFamily: 'monospace',
                                                    background: '#f0fdf4', padding: '2px 6px',
                                                    borderRadius: '4px', color: '#15803d'
                                                }}>
                                                    {product.tag_id.length > 12 ? product.tag_id.substring(0, 12) + '…' : product.tag_id}
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    background: '#d97706'
                                                }}></div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706' }}>
                                                    No Tag
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {canEditProduct && (
                                                <button className="btn" style={{ padding: '6px', background: '#f1f5f9' }} onClick={() => setEditingProduct(product)}>
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                            {canDeleteProduct && (
                                                <button className="btn" style={{ padding: '6px', background: '#fee2e2', color: '#dc2626' }} onClick={() => handleDelete(product.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content animate-slide" style={{ background: 'white', padding: '2rem 2.5rem', borderRadius: '32px', width: '100%', maxWidth: '640px', boxShadow: 'var(--shadow-lg)', overflowY: 'auto', maxHeight: '90vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create Product</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} style={{ color: '#94a3b8' }} />
                            </button>
                        </div>

                        {/* Flow Diagram */}
                        <div style={{
                            padding: '12px 16px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                            borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid #c7d2fe',
                            fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'
                        }}>
                            <span>📝 Form</span>
                            <span>→</span>
                            <span>🔌 API</span>
                            <span>→</span>
                            <span>🗄️ MySQL</span>
                            <span>→</span>
                            <span>📡 NFC Ready</span>
                        </div>

                        <form onSubmit={handleAddProduct}>
                            <div className="input-group">
                                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Product Name *</label>
                                <input name="name" type="text" placeholder="e.g. iPhone 15 Pro" required maxLength={50}
                                    style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>SKU *</label>
                                    <input name="sku" type="text" placeholder="e.g. IP15-PRO-BLK" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Category *</label>
                                    <select name="category" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%', background: 'white' }}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Grocery">Grocery</option>
                                        <option value="Stationery">Stationery</option>
                                        <option value="Accessories">Accessories</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Purchase Price *</label>
                                    <input name="purchase_price" type="number" step="0.01" defaultValue="0" min="0" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Selling Price *</label>
                                    <input name="selling_price" type="number" step="0.01" defaultValue="0" min="0" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#16a34a' }}>Stock In *</label>
                                    <input name="stock_in" type="number" defaultValue="0" min="0" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#dc2626' }}>Stock Out *</label>
                                    <input name="stock_out" type="number" defaultValue="0" min="0" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* NFC Tag ID Field */}
                            <div className="input-group" style={{ marginTop: '0.5rem' }}>
                                <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Wifi size={14} style={{ color: 'var(--primary)' }} />
                                    NFC Tag ID
                                    <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-muted)' }}>(optional — can link later from Scan page)</span>
                                </label>
                                <input name="tag_id" type="text" placeholder="e.g. 2190962515 or leave blank"
                                    style={{
                                        padding: '12px 14px', borderRadius: '12px', width: '100%',
                                        border: '2px dashed #c7d2fe', background: '#f8faff',
                                        fontFamily: 'monospace', fontSize: '0.95rem'
                                    }}
                                />
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                    💡 If you have the NFC tag ID, enter it now to link instantly. Otherwise, you can scan the tag later on the Scan page and link it to this product.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: '#f1f5f9', padding: '14px' }} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={savingProduct}>
                                    {savingProduct ? (
                                        <>
                                            <Database size={16} style={{ animation: 'pulse 1s infinite' }} />
                                            Saving to MySQL...
                                        </>
                                    ) : (
                                        <>
                                            <Database size={16} />
                                            Save to Database
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingProduct && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content animate-slide" style={{ background: 'white', padding: '2rem 2.5rem', borderRadius: '32px', width: '100%', maxWidth: '640px', boxShadow: 'var(--shadow-lg)', overflowY: 'auto', maxHeight: '90vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Edit Product</h2>
                            <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} style={{ color: '#94a3b8' }} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProduct}>
                            <div className="input-group">
                                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Product Name</label>
                                <input name="name" type="text" defaultValue={editingProduct.name} required maxLength={50}
                                    style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Category</label>
                                    <select name="category" defaultValue={editingProduct.category} required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%', background: 'white' }}
                                    >
                                        <option value="Electronics">Electronics</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Grocery">Grocery</option>
                                        <option value="Stationery">Stationery</option>
                                        <option value="Accessories">Accessories</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', visibility: 'hidden' }}>Spacer</label>
                                    <div style={{ height: '45px' }}></div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Purchase Price</label>
                                    <input name="purchase_price" type="number" step="0.01" defaultValue={editingProduct.purchase_price} min="0" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Selling Price</label>
                                    <input name="selling_price" type="number" step="0.01" defaultValue={editingProduct.selling_price} min="0" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#16a34a' }}>Stock In</label>
                                    <input name="stock_in" type="number" defaultValue={editingProduct.stock_in} min="0" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#dc2626' }}>Stock Out</label>
                                    <input name="stock_out" type="number" defaultValue={editingProduct.stock_out} min="0" required
                                        style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* NFC Tag ID Field */}
                            <div className="input-group" style={{ marginTop: '0.5rem' }}>
                                <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Wifi size={14} style={{ color: 'var(--primary)' }} />
                                    NFC Tag ID
                                </label>
                                <input name="tag_id" type="text" defaultValue={editingProduct.tag_id || ''}
                                    placeholder="Enter NFC Tag ID or leave blank"
                                    style={{
                                        padding: '12px 14px', borderRadius: '12px', width: '100%',
                                        border: editingProduct.tag_id ? '2px solid #16a34a' : '2px dashed #c7d2fe',
                                        background: editingProduct.tag_id ? '#f0fdf4' : '#f8faff',
                                        fontFamily: 'monospace', fontSize: '0.95rem'
                                    }}
                                />
                                {editingProduct.tag_id && (
                                    <p style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
                                        ✅ This product is currently linked to NFC tag: {editingProduct.tag_id}
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: '#f1f5f9', padding: '14px' }} onClick={() => setEditingProduct(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={savingProduct}>
                                    {savingProduct ? 'Updating MySQL...' : <>
                                        <Database size={16} /> Update Product
                                    </>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .table-row-hover {
                    transition: all 0.2s ease;
                }
                .table-row-hover:hover {
                    background-color: #f8fafc !important;
                    transform: scale(1.002);
                    box-shadow: inset 4px 0 0 var(--primary);
                }
                table th {
                    font-size: 0.75rem !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    color: #64748b !important;
                    padding: 1.25rem 1rem !important;
                }
            `}</style>
        </Layout>
    );
};

export default Products;
