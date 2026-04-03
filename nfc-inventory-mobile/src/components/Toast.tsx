import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Animated, Platform } from 'react-native';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide?: () => void;
  duration?: number;
}

const Toast = ({ 
  visible, 
  message, 
  type = 'info', 
  onHide, 
  duration = 3000 
}: ToastProps) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(20));

  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
      // Show
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Automatically hide
      const timer = setTimeout(() => {
        hide();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hide();
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsRendering(false);
      if (onHide) onHide();
    });
  };

  if (!isRendering) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'error':
        return <XCircle size={20} color="#ef4444" />;
      default:
        return <Info size={20} color="#6366f1" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#f0fdf4';
      case 'error':
        return '#fef2f2';
      default:
        return '#f5f3ff';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#10b98120';
      case 'error':
        return '#ef444420';
      default:
        return '#6366f120';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <Text style={[styles.toastText, { color: type === 'error' ? theme.colors.danger : theme.colors.textMain }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconContainer: {
    marginRight: 12,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

export default Toast;
