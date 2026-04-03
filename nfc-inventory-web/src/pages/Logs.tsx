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

    const exportToExcel = () => {
        const headers = ["SR. NO.", "Movement", "Quantity", "Product", "SKU", "Status", "Timestamp"];
        const rows = logs.map((log, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${log.action}</td>
                <td>${log.quantity}</td>
                <td>${log.product?.name || 'N/A'}</td>
                <td>${log.product?.sku || 'N/A'}</td>
                <td>${log.status}</td>
                <td>${new Date(log.created_at).toLocaleString()}</td>
            </tr>
        `).join("");

        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Audit Logs</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
            <body>
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Inventory_Report_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToCSV = () => {
        const headers = ["SR. NO.", "Action", "Quantity", "Product", "SKU", "Status", "Timestamp"];
        const rows = logs.map((log, idx) => [
            idx + 1,
            log.action,
            log.quantity,
            log.product?.name || 'N/A',
            log.product?.sku || 'N/A',
            log.status,
            `"${new Date(log.created_at).toLocaleString()}"`
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" onClick={() => exportToCSV()} disabled={logs.length === 0} style={{ padding: '10px 16px', background: '#475569' }}>
                            <FileDown size={18} style={{ marginRight: '8px' }} /> CSV
                        </button>
                        <button className="btn btn-primary" onClick={exportToExcel} disabled={logs.length === 0} style={{ padding: '10px 16px', background: '#16a34a' }}>
                            <FileDown size={18} style={{ marginRight: '8px' }} /> Excel
                        </button>
                        <button className="btn btn-primary" onClick={() => window.print()} disabled={logs.length === 0} style={{ padding: '10px 16px', background: '#ef4444' }}>
                            <FileDown size={18} style={{ marginRight: '8px' }} /> PDF
                        </button>
                    </div>
                </header>

                <div className="table-container">
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: '#f8fafc' }} className="no-print">
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
                                <th style={{ width: '60px' }}>SR. NO.</th>
                                <th>Movement</th>
                                <th>Quantity</th>
                                <th>Product Details</th>
                                <th>Timestamp</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Fetching activity logs...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>
                                        <History size={48} style={{ margin: '0 auto 1rem', opacity: 0.1 }} />
                                        <p style={{ color: 'var(--text-muted)' }}>No logs found</p>
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log, idx) => (
                                <tr key={log.id} style={{ height: '80px' }}>
                                    <td style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {idx + 1}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                backgroundColor: log.action === 'IN' ? 'rgba(34, 197, 94, 0.1)' :
                                                                log.action === 'OUT' ? 'rgba(239, 68, 68, 0.1)' :
                                                                log.action === 'SCAN' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: log.action === 'IN' ? '#16a34a' :
                                                       log.action === 'OUT' ? '#dc2626' :
                                                       log.action === 'SCAN' ? '#6366f1' : '#f59e0b'
                                            }}>
                                                {log.action === 'IN' ? <ArrowUpCircle size={18} /> :
                                                 log.action === 'OUT' ? <ArrowDownCircle size={18} /> :
                                                 log.action === 'SCAN' ? <Scan size={18} /> : <LinkIcon size={18} />}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ 
                                                    fontSize: '0.7rem', 
                                                    fontWeight: 800, 
                                                    textTransform: 'uppercase',
                                                    color: log.action === 'IN' ? '#16a34a' :
                                                           log.action === 'OUT' ? '#dc2626' :
                                                           log.action === 'SCAN' ? '#6366f1' : '#f59e0b'
                                                }}>
                                                    {log.action === 'SCAN' ? 'TAG' : log.action === 'LINK' ? 'TAG' : 'STOCK'}
                                                </span>
                                                <span style={{ 
                                                    fontSize: '0.9rem', 
                                                    fontWeight: 900, 
                                                    textTransform: 'uppercase',
                                                    marginTop: '-4px',
                                                    color: log.action === 'IN' ? '#16a34a' :
                                                           log.action === 'OUT' ? '#dc2626' :
                                                           log.action === 'SCAN' ? '#4f46e5' : '#ea580c'
                                                }}>
                                                    {log.action === 'SCAN' ? 'DETECTED' :
                                                     log.action === 'LINK' ? 'LINKED' :
                                                     log.action}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ 
                                            fontWeight: 900, 
                                            fontSize: '1.25rem',
                                            color: log.action === 'IN' ? '#16a34a' :
                                                   log.action === 'OUT' ? '#dc2626' : '#94a3b8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {log.action === 'IN' ? '+' : log.action === 'OUT' ? '-' : ''}
                                            {log.quantity > 0 ? log.quantity : (log.action === 'SCAN' || log.action === 'LINK' ? '—' : log.quantity)}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{log.product?.name || 'Item Information Missing'}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SKU: {log.product?.sku || 'N/A'}</span>
                                            {log.reader_type && (
                                                <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{log.reader_type}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        <div>{new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                        <div style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td>
                                        <div style={{ 
                                            padding: '4px 12px', 
                                            borderRadius: '6px', 
                                            background: '#f0fdf4', 
                                            color: '#16a34a', 
                                            fontSize: '0.7rem', 
                                            fontWeight: 800,
                                            border: '1px solid #bbf7d0',
                                            display: 'inline-block'
                                        }}>
                                            {log.status?.toUpperCase() || 'SUCCESS'}
                                        </div>
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
