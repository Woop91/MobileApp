// ============================================================================
// RootNavigator - Routes between auth, steward, and member flows
// ============================================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { LoadingScreen } from '../components';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { StewardNavigator } from './StewardNavigator';
import { MemberNavigator } from './MemberNavigator';

const Stack = createNativeStackNavigator();

interface RootNavigatorProps {
  linking?: Record<string, unknown>;
}

export function RootNavigator({ linking }: RootNavigatorProps) {
  const { isLoading, isAuthenticated, role } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Starting DDS Dashboard..." />;
  }

  const isSteward = role === 'steward' || role === 'admin' || role === 'both';

  return (
    <NavigationContainer linking={linking as Parameters<typeof NavigationContainer>[0]['linking']}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : isSteward ? (
          <Stack.Screen name="StewardApp" component={StewardNavigator} />
        ) : (
          <Stack.Screen name="MemberApp" component={MemberNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
