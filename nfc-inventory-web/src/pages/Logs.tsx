import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getLogs } from '../api';
import { FileDown, History, Search, ArrowUpCircle, ArrowDownCircle, Scan, Link as LinkIcon } from 'lucide-react';

const Logs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;
            const data = await getLogs();
            setLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const exportToCSV = () => {
        const headers = ["ID", "Action", "Quantity", "Product", "SKU", "Status", "Timestamp"];
        const rows = logs.map(log => [
            log.id,
            log.action,
            log.quantity,
            log.product?.name || 'N/A',
            log.product?.sku || 'N/A',
            log.status,
            new Date(log.created_at).toLocaleString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredLogs = logs.filter(log =>
        log.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="animate-fade">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Audit Logs & Reports</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Complete history of every stock movement and tag scan</p>
                    </div>
                    <button className="btn btn-primary" onClick={exportToCSV} disabled={logs.length === 0}>
                        <FileDown size={18} style={{ marginRight: '8px' }} /> Export CSV Report
                    </button>
                </header>

                <div className="table-container">
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Filter by product name, SKU or action (IN/OUT)..."
                                style={{ width: '100%', paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Movement</th>
                                <th>Quantity</th>
                                <th>Product Details</th>
                                <th>Timestamp</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Loading activity history...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                                        <History size={48} style={{ margin: '0 auto 1rem', opacity: 0.1 }} />
                                        <p style={{ color: 'var(--text-muted)' }}>No logs found</p>
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontWeight: 700,
                                            color: log.action === 'IN' ? '#16a34a' :
                                                log.action === 'OUT' ? '#dc2626' :
                                                    log.action === 'SCAN' ? '#6366f1' : '#f59e0b'
                                        }}>
                                            {log.action === 'IN' ? <ArrowUpCircle size={16} /> :
                                                log.action === 'OUT' ? <ArrowDownCircle size={16} /> :
                                                    log.action === 'SCAN' ? <Scan size={16} /> : <LinkIcon size={16} />}
                                            {log.action === 'SCAN' ? 'TAG DETECTED' :
                                                log.action === 'LINK' ? 'TAG LINKED' :
                                                    `STOCK ${log.action}`}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                            {log.action === 'IN' ? '+' : log.action === 'OUT' ? '-' : ''}{log.quantity > 0 ? log.quantity : (log.action === 'SCAN' || log.action === 'LINK' ? '—' : log.quantity)}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{log.product?.name || 'Deleted Product'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {log.product?.sku || 'N/A'}</div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {new Date(log.created_at).toLocaleString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{log.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Logs;
