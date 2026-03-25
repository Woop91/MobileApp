// ============================================================================
// App.tsx - Root component for DDS Dashboard Mobile
// ============================================================================

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider } from './src/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SetupScreen } from './src/screens/auth/SetupScreen';
import { getStoredApiUrl } from './src/auth/session';
import { setApiBaseUrl } from './src/api/config';
import { LoadingScreen, ErrorBoundary } from './src/components';
import { linkingConfig } from './src/utils/deepLink';

function AppContent() {
  const { isDark } = useTheme();
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    checkApiUrl();
  }, []);

  async function checkApiUrl() {
    const url = await getStoredApiUrl();
    if (url) {
      setApiBaseUrl(url);
      setApiConfigured(true);
    } else {
      setApiConfigured(false);
    }
  }

  if (apiConfigured === null) {
    return <LoadingScreen message="Starting..." />;
  }

  if (!apiConfigured) {
    return (
      <SetupScreen
        onComplete={() => setApiConfigured(true)}
      />
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <RootNavigator linking={linkingConfig} />
      </AuthProvider>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
