import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { 
  Box, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  PlusCircle,
  AlertCircle, 
  LogOut,
  Users as UsersIcon,
  Activity
} from "lucide-react-native";

import { theme } from "../styles/theme";
import { getDashboardStats, logout } from "../api";
import { useStatusSync } from "../hooks/useStatusSync";

const DashboardScreen = ({ navigation }: any) => {
  // Activate Status Heartbeat
  useStatusSync();

  const [stats, setStats] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigation.navigate("Login");
  };

  const loadDashboard = async () => {
    try {
      setError(null);
      const data = await getDashboardStats();

      setStats(data?.stats || {});
      setScans(data?.scans || []);
      setTeam(data?.users || []);

    } catch (err: any) {
      console.log("Dashboard Error:", err);
      if (err?.response?.status === 401) {
        navigation.navigate("Login");
      } else {
        setError("Server unreachable. Tap to try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {

      loadDashboard();

      const interval = setInterval(loadDashboard, 30000);

      return () => clearInterval(interval);

    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (

    <View style={styles.mainContainer}>
      <View style={styles.fixedHeader}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Operations Center</Text>
            <Text style={styles.subtitle}>
              Real-time MySQL Sync Active
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={22} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>

      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* GLOBAL STATUS BANNER */}
        <View style={[
          styles.globalStatusBanner, 
          { backgroundColor: stats?.globalStatus === "All Users Online" ? "rgba(34, 197, 94, 0.1)" : "rgba(245, 158, 11, 0.1)" }
        ]}>
          <Activity size={18} color={stats?.globalStatus === "All Users Online" ? "#22c55e" : "#f59e0b"} />
          <Text style={[
            styles.globalStatusText, 
            { color: stats?.globalStatus === "All Users Online" ? "#22c55e" : "#f59e0b" }
          ]}>
            {stats?.globalStatus || "System Status Local"}
          </Text>
        </View>

        {/* STATS */}
        <View style={styles.statsGrid}>
          {/* ... existing stats ... */}
          <View style={styles.statCard}>
            <Box size={26} color="#6366f1" />
            <Text style={[styles.statNumber, { color: theme.colors.textMain }]}>
              {String(stats?.totalItems || 0)}
            </Text>
            <Text style={styles.statLabel}>TOTAL ITEMS</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={26} color="#22c55e" />
            <Text style={[styles.statNumber, { color: theme.colors.textMain }]}>
              {String(stats?.totalStock || 0)}
            </Text>
            <Text style={styles.statLabel}>GLOBAL STOCK</Text>
          </View>
        </View>

        {/* TEAM AVAILABILITY */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Team Availability</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamSlider}>
          {team.map((user: any, index: number) => (
            <View key={index} style={styles.userStatusCard}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: user.status === 'online' ? theme.colors.accent : theme.colors.danger }
              ]} />
              <UsersIcon size={20} color={theme.colors.textMuted} />
              <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role.toUpperCase()}</Text>
            </View>
          ))}
        </ScrollView>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("Scan")}>
            <Search size={22} color={theme.colors.primary} />
            <Text style={styles.actionText}>Inventory Lookup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("Scan")}>
            <Box size={22} color={theme.colors.accent} />
            <Text style={styles.actionText}>Quick Stock In</Text>
          </TouchableOpacity>
        </View>

        {/* LIVE FEED */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Live Scan Feed</Text>
          <Text style={styles.realTime}>REAL-TIME</Text>
        </View>

      {scans.length === 0 && !error && (
        <Text style={{ textAlign: "center", color: "#94a3b8", marginTop: 20 }}>
          No scans found yet.
        </Text>
      )}

      {scans.map((scan, index) => {

        const timeStr = scan.created_at
          ? new Date(scan.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })
          : "";

        return (
          <View key={index} style={styles.scanItem}>

            <View style={styles.scanItemIcon}>
              <Search size={20} color="white" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.scanItemTitle}>
                {scan.product?.name || "Unknown Tag"}
              </Text>

              <Text style={styles.scanItemSub}>
                ID: 2190962515 • {scan.reader_type}
              </Text>
            </View>

            <Text style={styles.scanTime}>
              {timeStr}
            </Text>

          </View>
        );

      })}

      </ScrollView>

      {/* FIXED PREMIUM SCAN FAB (BOTTOM) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.premiumScanCardFAB}
          onPress={() => navigation.navigate("Scan")}
          activeOpacity={0.9}
        >
          <View style={styles.premiumScanIcon}>
            <Search size={24} color="white" />
          </View>
          <View style={styles.premiumScanTextCol}>
            <Text style={styles.premiumScanTitleFAB}>Ready to Scan</Text>
            <Text style={styles.premiumScanSubFAB}>Tap to lookup inventory</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>

  );

};

export default DashboardScreen;



const styles = StyleSheet.create({

  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.bgMain,
  },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: theme.colors.bgMain,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgMain,
    padding: 20
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25
  },

  logoutBtn: {
    padding: 10,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.textMain
  },

  subtitle: {
    color: theme.colors.textMuted
  },

  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    background: 'transparent'
  },
  premiumScanCardFAB: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  premiumScanIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  premiumScanTextCol: {
    flex: 1
  },
  premiumScanTitleFAB: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  premiumScanSubFAB: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1
  },


  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  statCard: {
    width: "48%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 3
  },

  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10
  },

  statLabel: {
    color: theme.colors.textMuted
  },

  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10
  },

  feedTitle: {
    fontSize: 20,
    fontWeight: "700"
  },

  realTime: {
    color: "#6366f1",
    fontWeight: "700"
  },

  scanItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10
  },

  scanItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },

  scanItemTitle: {
    fontWeight: "700"
  },

  scanItemSub: {
    color: theme.colors.textMuted
  },

  scanTime: {
    color: "#6366f1",
    fontWeight: "700"
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)"
  },

  errorText: {
    color: "#ef4444",
    marginLeft: 10,
    fontWeight: "600",
    flex: 1
  },

  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20
  },

  actionCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },

  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.secondary
  },
  globalStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10
  },
  globalStatusText: {
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textMain
  },
  teamSlider: {
    marginBottom: 25,
    marginHorizontal: -5
  },
  userStatusCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 16,
    marginHorizontal: 5,
    width: 120,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: "relative"
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "white",
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textMain,
    marginTop: 8
  },
  userRole: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginTop: 2
  }

});