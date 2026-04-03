import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUserStatus } from '../api';

export const useStatusSync = () => {
    const appState = useRef(AppState.currentState);

    const updateStatus = async (status: 'online' | 'offline') => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                await updateUserStatus(user.email, status);
                console.log(`Status synced: ${status} for ${user.email}`);
            }
        } catch (error) {
            console.error('Failed to sync status:', error);
        }
    };

    useEffect(() => {
        // 1. Initial online status
        updateStatus('online');

        // 2. Heartbeat (every 45 seconds to stay within 60s backend threshold)
        const heartbeatInterval = setInterval(() => {
            if (appState.current === 'active') {
                updateStatus('online');
            }
        }, 45000);

        // 3. Handle App State (Background/Foreground)
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // Return to foreground
                updateStatus('online');
            } else if (nextAppState.match(/inactive|background/)) {
                // Moving to background - we can stay 'online' for a tiny bit then offline
                // But as per requirements: "Background mode → optionally keep online for short duration"
                // The heartbeat will stop, and the server will mark as offline after 60s automatically,
                // but we can also set to offline immediately if preferred.
                // Let's set to offline after 30s in background to be safe.
                setTimeout(() => {
                    if (AppState.currentState !== 'active') {
                        updateStatus('offline');
                    }
                }, 30000);
            }
            appState.current = nextAppState;
        });

        // 4. Cleanup on unmount
        return () => {
            subscription.remove();
            clearInterval(heartbeatInterval);
            updateStatus('offline');
        };
    }, []);
};
