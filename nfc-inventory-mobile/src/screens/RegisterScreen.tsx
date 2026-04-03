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
    KeyboardAvoidingView
} from 'react-native';
import { Nfc, User, Mail, Lock, AlertCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { register } from '../api';
import Toast, { ToastType } from '../components/Toast';

const RegisterScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<ToastType>('info');

    const showToast = (message: string, type: ToastType = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const handleRegister = async () => {
        if (!name || !email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            setLoading(true);
            await register({ name, email, password });

            // Requirement: Toast message "Registration successful"
            showToast('Registration successful', 'success');

            // Wait a moment for the toast to be seen before navigating
            setTimeout(() => {
                navigation.navigate('Login');
            }, 1500);

        } catch (err: any) {
            console.error('Registration error:', err);
            
            if (err.response) {
                // Requirement: Duplicate user → “User already exists”
                const detail = err.response.data?.detail;
                if (detail && detail.toLowerCase().includes('already registered')) {
                    showToast('User already exists', 'error');
                } else if (err.response.status === 400 || err.response.status === 409) {
                    showToast('User already exists', 'error');
                } else {
                    // Requirement: Registration failed. Please try again
                    showToast('Registration failed. Please try again', 'error');
                }
            } else if (err.request) {
                // Requirement: Network error → “Network error. Check your connection”
                showToast('Network error. Check your connection', 'error');
            } else {
                showToast('Registration failed. Please try again', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.logoIcon}>
                        <Nfc color="white" size={28} />
                    </View>
                    <Text style={styles.logoText}>Create Account</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrapper}>
                        <User size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={theme.colors.textMuted}
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
                            placeholderTextColor={theme.colors.textMuted}
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
                            placeholderTextColor={theme.colors.textMuted}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.registerBtn, loading ? styles.registerBtnDisabled : null]}
                    onPress={handleRegister}
                    disabled={loading}
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

            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />
        </KeyboardAvoidingView>
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
        paddingBottom: 80, // Space for toast/avoiding being cut
        minHeight: '100%'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20
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
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
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
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    registerBtnDisabled: {
        opacity: 0.7,
        shadowOpacity: 0.1
    },
    registerBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700'
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
        marginBottom: 40
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
