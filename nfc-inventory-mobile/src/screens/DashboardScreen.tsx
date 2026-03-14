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
  AlertCircle,
  LogOut
} from "lucide-react-native";

import { theme } from "../styles/theme";
import { getDashboardStats, getNfcScans } from "../api";

const DashboardScreen = ({ navigation }: any) => {

  const [stats, setStats] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    navigation.navigate("Login");
  };

  const loadDashboard = async () => {
    try {

      setLoading(true);
      setError(null);

      // 🔹 check token first
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setError("Authentication error. Please login again.");
        navigation.navigate("Login");
        return;
      }

      const statsData = await getDashboardStats();

      setStats(statsData?.stats || statsData);
      setScans(statsData?.scans || []);

    } catch (err: any) {

      console.log("Dashboard Error:", err?.response?.data || err);

      if (err?.response?.status === 401) {
        setError("Authentication error. Please login again.");
        navigation.navigate("Login");
      }
      else if (err?.response) {
        setError(err.response.data?.detail || "API Error");
      }
      else {
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

    <ScrollView style={styles.container}>

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

      {/* SCAN CARD */}

      <TouchableOpacity
        style={styles.scanCard}
        onPress={() => navigation.navigate("Scan")}
      >

        <View style={styles.scanIcon}>
          <Search size={26} color="white" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.scanTitle}>Ready to Scan</Text>
          <Text style={styles.scanSub}>
            Tap to start NFC inventory lookup
          </Text>
        </View>

      </TouchableOpacity>

      {/* STATS */}

      <View style={styles.statsGrid}>

        <View style={styles.statCard}>
          <Box size={26} color="#6366f1" />
          <Text style={styles.statNumber}>
            {stats?.totalItems || 0}
          </Text>
          <Text style={styles.statLabel}>TOTAL ITEMS</Text>
        </View>

        <View style={styles.statCard}>
          <TrendingUp size={26} color="#22c55e" />
          <Text style={styles.statNumber}>
            {stats?.totalStock || 0}
          </Text>
          <Text style={styles.statLabel}>GLOBAL STOCK</Text>
        </View>

        <View style={styles.statCard}>
          <AlertTriangle size={26} color="#ef4444" />
          <Text style={styles.statNumber}>
            {stats?.lowStock || 0}
          </Text>
          <Text style={styles.statLabel}>LOW STOCK</Text>
        </View>

        <View style={styles.statCard}>
          <Search size={26} color="#f59e0b" />
          <Text style={styles.statNumber}>
            {scans?.length || 0}
          </Text>
          <Text style={styles.statLabel}>RECENT SCANS</Text>
        </View>

      </View>
      
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

      {/* ERROR */}

      {error && (
        <TouchableOpacity style={styles.errorBox} onPress={loadDashboard}>
          <AlertCircle color={theme.colors.danger} size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      )}

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
                ID: {scan.serial_number} • {scan.reader_type}
              </Text>
            </View>

            <Text style={styles.scanTime}>
              {timeStr}
            </Text>

          </View>
        );

      })}

    </ScrollView>

  );

};

export default DashboardScreen;



const styles = StyleSheet.create({

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

  scanCard: {
    backgroundColor: "#0f172a",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25
  },

  scanIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15
  },

  scanTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700"
  },

  scanSub: {
    color: "#94a3b8"
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
  }

});