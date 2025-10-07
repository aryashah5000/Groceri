import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { theme } from '../theme';
import { HistoryProvider } from '../contexts/HistoryContext';


export default function RootLayout() {
  const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.bg } };
  useEffect(() => {
    // Enable LayoutAnimation on Android. Without this call, animations may
    // silently fail on some devices. We guard against undefined to avoid
    // errors on iOS.
    const { UIManager, Platform } = require('react-native');
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);
  return (
    <HistoryProvider>
      <ThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* The tabs layout contains the bottom tab bar; placing it inside
          the Stack means additional screens (like modals) can be
          presented above the tabs without losing state. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Include the modals group so any screens defined inside
          app/(modals) will be shown with a modal presentation. */}
          <Stack.Screen name="(modals)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </HistoryProvider>
  );
}