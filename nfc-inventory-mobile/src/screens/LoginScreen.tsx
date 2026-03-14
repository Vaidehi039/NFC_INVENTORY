import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert
} from "react-native";

import { Mail, Lock, Eye, EyeOff, Nfc, AlertCircle, Settings, X, Server } from "lucide-react-native";
import { theme } from "../styles/theme";
import { login, initAPI, setBaseURL } from "../api";

const LoginScreen = ({ navigation }: any) => {

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");

  // Server Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    const loadUrl = async () => {
      const url = await initAPI();
      setCurrentUrl(url);
      setNewUrl(url);
    };
    loadUrl();
  }, []);

  const handleUpdateUrl = async () => {
    try {
      if (!newUrl.startsWith("http")) {
        Alert.alert("Invalid URL", "Please include http:// or https://");
        return;
      }
      await setBaseURL(newUrl);
      setCurrentUrl(newUrl);
      setShowSettings(false);
      Alert.alert("Success", "Server URL updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to update URL");
    }
  };

  const handleLogin = async () => {

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {

      setLoading(true);
      setError(null);

      const response = await login(email.trim(), password);

      if (response.access_token) {
        console.log("Login successful:", response);
        navigation.replace("Dashboard");
      } else if (response.token) { // Handle variations
         navigation.replace("Dashboard");
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.response) {
        setError(err.response.data?.detail || "Invalid credentials");
      }
      else if (err.request) {
        setError(`Cannot connect to server at: ${currentUrl}\n\nCheck your IP & WiFi.`);
      }
      else {
        setError("Something went wrong. check console.");
      }

    } finally {
      setLoading(false);
    }
  };

  return (

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >

      {/* Server Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleRow}>
                <Settings size={20} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>Server Settings</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <X color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Backend URL</Text>
            <View style={styles.inputWrapper}>
              <Server size={18} color={theme.colors.textMuted} />
              <TextInput
                style={styles.input}
                value={newUrl}
                onChangeText={setNewUrl}
                placeholder="http://192.168.1.5:8000"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={styles.saveBtn}
              onPress={handleUpdateUrl}
            >
              <Text style={styles.saveBtnText}>Save Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.content}>

          {/* Logo - Long press for settings */}
          <TouchableOpacity 
            onLongPress={() => setShowSettings(true)}
            delayLongPress={2000}
            activeOpacity={0.8}
            style={styles.logoRow}
          >
            <View style={styles.logoIcon}>
              <Nfc color="white" size={28} />
            </View>

            <Text style={styles.logoText}>
              NFC Inventory Pro
            </Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>
            Welcome back
          </Text>

          <Text style={styles.subtitle}>
            Sign in to manage your inventory
          </Text>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <AlertCircle color={theme.colors.danger} size={18} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={styles.label}>Email</Text>

          <View style={styles.inputWrapper}>
            <Mail size={20} color={theme.colors.textMuted} />

            <TextInput
              style={styles.input}
              placeholder="admin@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>

          <View style={styles.inputWrapper}>
            <Lock size={20} color={theme.colors.textMuted} />

            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword
                ? <EyeOff size={20} color={theme.colors.textMuted} />
                : <Eye size={20} color={theme.colors.textMuted} />}
            </TouchableOpacity>

          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading ? { opacity: 0.7 } : { opacity: 1 }]}
            onPress={handleLogin}
            disabled={!!loading}
          >

            {loading
              ? <ActivityIndicator color="white" animating={true} />
              : <Text style={styles.loginText}>Sign In</Text>
            }

          </TouchableOpacity>

          {/* Register Link FIXED */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            style={styles.registerLink}
          >

            <View style={styles.registerRow}>

              <Text style={styles.registerText}>
                Don't have an account?
              </Text>

              <Text style={styles.registerHighlight}>
                {" "}Register
              </Text>

            </View>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({

  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: theme.colors.bgMain
  },

  content: {
    padding: 30
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30
  },

  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center"
  },

  logoText: {
    fontSize: 22,
    fontWeight: "800",
    marginLeft: 12,
    color: theme.colors.secondary
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.textMain
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 30,
    color: theme.colors.textMuted,
    fontSize: 16
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)"
  },

  errorText: {
    color: theme.colors.danger,
    marginLeft: 8,
    flex: 1
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginBottom: 6
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    marginBottom: 20
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    color: theme.colors.textMain
  },

  loginBtn: {
    backgroundColor: theme.colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10
  },

  loginText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700"
  },

  registerLink: {
    marginTop: 25,
    alignItems: "center"
  },

  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },

  registerText: {
    color: theme.colors.textMuted,
    fontSize: 15
  },

  registerHighlight: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 15
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 10,
    color: theme.colors.textMain
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginBottom: 10
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10
  },
  saveBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16
  }

});