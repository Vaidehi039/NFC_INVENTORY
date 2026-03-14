import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Nfc, User, Mail, Lock, AlertCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { register } from '../api';

const RegisterScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await register({ name, email, password });

            Alert.alert(
                "Success",
                "Account created successfully! You can now sign in.",
                [{ text: "OK", onPress: () => navigation.navigate('Login') }]
            );
        } catch (err: any) {
            console.error('Registration error:', err);
            
            if (err.response) {
                // Server responded with an error (e.g., 400 Bad Request)
                setError(err.response.data?.detail || 'Failed to create account.');
            } else if (err.request) {
                // Network error (Server unreachable)
                setError('Cannot connect to server. Please check your WiFi or update your Server URL in Login Settings.');
            } else {
                setError('Something went wrong. Please try again.');
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
                    <Text style={styles.logoText}>Create Account</Text>
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <AlertCircle color={theme.colors.danger} size={18} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrapper}>
                        <User size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                        <Mail size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="john@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                        <Lock size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.registerBtn, loading ? { opacity: 0.7 } : { opacity: 1 }]}
                    onPress={handleRegister}
                    disabled={!!loading}
                >
                    {loading ? (
                        <ActivityIndicator animating={true} color="white" size="small" />
                    ) : (
                        <Text style={styles.registerBtnText}>Create Account</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    style={styles.footer}
                >
                    <Text style={styles.footerText}>
                        Already have an account? <Text style={styles.loginLink}>Sign In</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bgMain
    },
    scrollContent: {
        padding: 32,
        justifyContent: 'center',
        minHeight: '100%'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40
    },
    logoIcon: {
        width: 48,
        height: 48,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoText: {
        fontSize: 24,
        fontWeight: '800',
        marginLeft: 12,
        color: theme.colors.secondary
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    errorText: {
        color: theme.colors.danger,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textMuted,
        marginBottom: 8
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        paddingHorizontal: 12
    },
    inputIcon: {
        marginRight: 10
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: theme.colors.textMain
    },
    registerBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 20,
        elevation: 4
    },
    registerBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700'
    },
    footer: {
        marginTop: 32,
        alignItems: 'center'
    },
    footerText: {
        color: theme.colors.textMuted
    },
    loginLink: {
        color: theme.colors.primary,
        fontWeight: '700'
    }
});

export default RegisterScreen;
