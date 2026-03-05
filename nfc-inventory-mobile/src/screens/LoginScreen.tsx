import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Nfc, Mail, Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { theme } from "../styles/theme";
import { login } from "../api";

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await login(email.trim(), password);

      navigation.replace("Dashboard");
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data?.detail || "Invalid credentials");
      } else if (err.request) {
        setError("Cannot connect to server. Check your IP & WiFi.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Nfc color="white" size={28} />
          </View>
          <Text style={styles.logoText}>NFC Inventory Pro</Text>
        </View>

        <Text style={styles.welcomeTitle}>Welcome back</Text>
        <Text style={styles.welcomeSubtitle}>
          Sign in to manage your inventory
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle color={theme.colors.danger} size={18} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
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
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { paddingRight: 50 }]}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <EyeOff size={20} color={theme.colors.textMuted} />
              ) : (
                <Eye size={20} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgMain,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    justifyContent: "center",
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  logoIcon: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 22,
    fontWeight: "800",
    marginLeft: theme.spacing.md,
    color: theme.colors.secondary,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.secondary,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginBottom: 25,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    color: theme.colors.danger,
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.textMain,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
  loginBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  loginBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});