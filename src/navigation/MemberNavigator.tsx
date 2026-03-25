// ============================================================================
// MemberNavigator - Tab + stack navigation with animated tab icons
// ============================================================================

import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { AnimatedTabIcon } from './AnimatedTabIcon';

import { MemberDashboardScreen } from '../screens/member/MemberDashboardScreen';
import { MyGrievancesScreen } from '../screens/member/MyGrievancesScreen';
import { GrievanceDetailScreen } from '../screens/member/GrievanceDetailScreen';
import { SurveyScreen } from '../screens/member/SurveyScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { ResourcesScreen } from '../screens/shared/ResourcesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="MemberHome" component={MemberDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GrievanceDetail" component={GrievanceDetailScreen} options={{ title: 'Case Details' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Survey" component={SurveyScreen} options={{ title: 'Survey' }} />
      <Stack.Screen name="Resources" component={ResourcesScreen} options={{ title: 'Resources' }} />
    </Stack.Navigator>
  );
}

function GrievancesStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="MyGrievancesList" component={MyGrievancesScreen} options={{ title: 'My Cases' }} />
      <Stack.Screen name="GrievanceDetail" component={GrievanceDetailScreen} options={{ title: 'Case Details' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Survey" component={SurveyScreen} options={{ title: 'Survey' }} />
      <Stack.Screen name="Resources" component={ResourcesScreen} options={{ title: 'Resources' }} />
    </Stack.Navigator>
  );
}

export function MemberNavigator() {
  const { theme } = useTheme();
  const { colors } = theme;
  const { batchData } = useAuth();

  const TAB_ICONS: Record<string, string> = {
    Home: 'home',
    'My Cases': 'document-text',
    Profile: 'person-circle',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size, focused }) => (
          <AnimatedTabIcon name={TAB_ICONS[route.name] || 'home'} color={color} size={size} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="My Cases" component={GrievancesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

