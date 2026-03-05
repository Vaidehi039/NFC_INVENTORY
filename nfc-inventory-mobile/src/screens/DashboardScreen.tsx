import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Platform
} from 'react-native';
import {
    Package,
    TrendingUp,
    AlertTriangle,
    Wifi,
    MousePointer2,
    Scan,
    History,
    Plus,
    ArrowRight,
    Search
} from 'lucide-react-native';
import { theme } from '../styles/theme';
import { LineChart } from 'react-native-chart-kit';
import { getDashboardStats, getNfcScans } from '../api';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }: any) => {
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data.stats);
            setRecentActivity(data.recentActivity || []);

            const scansData = await getNfcScans();
            setRecentScans(scansData.slice(0, 5));
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading === true || !stats) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
                <Text style={{ marginTop: 12, color: theme.colors.textMuted }}>Syncing MySQL Data...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bgMain }}>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing === true} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Operations Center</Text>
                        <Text style={styles.headerSubtitle}>Real-time MySQL Sync Active</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerScanBtn} onPress={() => navigation.navigate('Scan')}>
                            <Scan color="white" size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Scan')}>
                            <Image
                                source={{ uri: 'https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff' }}
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Action Banner */}
                <TouchableOpacity style={styles.actionBanner} onPress={() => navigation.navigate('Scan')}>
                    <View style={styles.actionBannerContent}>
                        <View style={styles.actionBannerIcon}>
                            <Scan color="white" size={24} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.actionBannerTitle}>Ready to Scan</Text>
                            <Text style={styles.actionBannerSub}>Tap to start NFC inventory lookup</Text>
                        </View>
                        <ArrowRight color="white" size={20} />
                    </View>
                </TouchableOpacity>

                <View style={styles.statsGrid}>
                    <StatCard
                        icon={<Package color={theme.colors.primary} size={20} />}
                        title={stats?.totalItems || 0}
                        sub="Total Items"
                        color="rgba(99, 102, 241, 0.1)"
                    />
                    <StatCard
                        icon={<TrendingUp color={theme.colors.accent} size={20} />}
                        title={stats?.totalStock || 0}
                        sub="Global Stock"
                        color="rgba(16, 185, 129, 0.1)"
                    />
                    <StatCard
                        icon={<AlertTriangle color={theme.colors.danger} size={20} />}
                        title={stats?.lowStock || 0}
                        sub="Low Stock"
                        color="rgba(239, 68, 68, 0.1)"
                    />
                    <StatCard
                        icon={<Search color={theme.colors.warning} size={20} />}
                        title={recentScans.length}
                        sub="Recent Scans"
                        color="rgba(245, 158, 11, 0.1)"
                    />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Live Scan Feed</Text>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>REAL-TIME</Text>
                        </View>
                    </View>
                    <View style={styles.listCard}>
                        {recentScans.length === 0 ? (
                            <Text style={styles.emptyText}>No recent scans detected</Text>
                        ) : (
                            recentScans.map((scan, idx) => (
                                <View key={scan.id || idx} style={styles.scanRow}>
                                    <View style={[styles.scanIcon, { backgroundColor: scan.reader_type === 'manual' ? '#f59e0b' : '#6366f1' }]}>
                                        {scan.reader_type === 'manual' ? <Search size={16} color="white" /> : <Scan size={16} color="white" />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.stockName}>{scan.product?.name || 'Unknown Item'}</Text>
                                        <Text style={styles.stockAction}>Tag: {scan.serial_number} • {scan.reader_type}</Text>
                                    </View>
                                    <Text style={styles.timeText}>
                                        {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity Trend</Text>
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={{
                                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                                datasets: [{ data: [12, 19, 15, 21, 14, 25] }]
                            }}
                            width={screenWidth - 64}
                            height={160}
                            chartConfig={chartConfig}
                            bezier={true}
                            style={styles.chart}
                            withInnerLines={false}
                            withOuterLines={false}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Stock Transactions</Text>
                        <TouchableOpacity>
                            <View style={styles.historyBtn}>
                                <History size={14} color={theme.colors.primary} />
                                <Text style={styles.viewMore}>History</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.listCard}>
                        {recentActivity.slice(0, 5).map((log: any) => (
                            <StockRow
                                key={log.id}
                                name={log.product?.name || 'Unknown'}
                                action={log.action === 'IN' ? 'Restock' : log.action === 'OUT' ? 'Dispatch' : log.action}
                                qty={log.action === 'IN' ? `+${log.quantity}` : log.action === 'OUT' ? `-${log.quantity}` : '—'}
                                status="success"
                            />
                        ))}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.8}
            >
                <Scan color="white" size={28} />
            </TouchableOpacity>
        </View>
    );
};

const StatCard = ({ icon, title, sub, color }: any) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconWrapper, { backgroundColor: color }]}>{icon}</View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSub}>{sub}</Text>
    </View>
);

const StockRow = ({ name, action, qty, status }: any) => (
    <View style={styles.stockRow}>
        <View style={{ flex: 1 }}>
            <Text style={styles.stockName}>{name}</Text>
            <Text style={styles.stockAction}>{action}</Text>
        </View>
        <Text style={[styles.stockQty, { color: qty.startsWith('+') ? theme.colors.accent : qty.startsWith('-') ? theme.colors.danger : theme.colors.textMuted }]}>
            {qty}
        </Text>
    </View>
);

const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: '#fff',
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    propsForDots: {
        r: 6,
        strokeWidth: 2,
        stroke: "#fff"
    },
    decimalPlaces: 0,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: Platform.OS === 'ios' ? 40 : 20,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerScanBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: theme.colors.secondary,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '600',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
    },
    actionBanner: {
        backgroundColor: theme.colors.secondary,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    actionBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBannerIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBannerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    actionBannerSub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 8,
    },
    statCard: {
        width: (screenWidth - 48 - 12) / 2,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.secondary,
        marginBottom: 2,
    },
    statSub: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.secondary,
    },
    historyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    viewMore: {
        color: theme.colors.primary,
        fontWeight: '800',
        fontSize: 12,
    },
    chartContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    listCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    stockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    scanRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    scanIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    emptyText: {
        textAlign: 'center',
        padding: 24,
        color: theme.colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    stockName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textMain,
    },
    stockAction: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.textMuted,
        marginTop: 1,
    },
    stockQty: {
        fontSize: 16,
        fontWeight: '800',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        marginRight: 6,
    },
    liveText: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.colors.primary,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    }
});

export default DashboardScreen;
