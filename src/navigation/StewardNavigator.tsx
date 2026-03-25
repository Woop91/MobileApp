// ============================================================================
// StewardNavigator - Tab + stack navigation with animated tab icons
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { hapticLight } from '../utils/haptics';
import { AnimatedTabIcon } from './AnimatedTabIcon';

import { StewardDashboardScreen } from '../screens/steward/StewardDashboardScreen';
import { CasesScreen } from '../screens/steward/CasesScreen';
import { CaseDetailScreen } from '../screens/steward/CaseDetailScreen';
import { MembersScreen } from '../screens/steward/MembersScreen';
import { MemberDetailScreen } from '../screens/steward/MemberDetailScreen';
import { TasksScreen } from '../screens/steward/TasksScreen';
import { CreateTaskScreen } from '../screens/steward/CreateTaskScreen';
import { InsightsScreen } from '../screens/steward/InsightsScreen';
import { GrievanceFormScreen } from '../screens/steward/GrievanceFormScreen';
import { LogContactScreen } from '../screens/steward/LogContactScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { ResourcesScreen } from '../screens/shared/ResourcesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="DashboardHome" component={StewardDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} options={{ title: 'Case Details', headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="GrievanceForm" component={GrievanceFormScreen} options={{ title: 'File Grievance' }} />
    </Stack.Navigator>
  );
}

function CasesStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="CasesList" component={CasesScreen} options={{ title: 'Cases' }} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} options={{ title: 'Case Details', headerShown: false }} />
      <Stack.Screen name="GrievanceForm" component={GrievanceFormScreen} options={{ title: 'File Grievance' }} />
    </Stack.Navigator>
  );
}

function MembersStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="MembersList" component={MembersScreen} options={{ title: 'Members' }} />
      <Stack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: 'Member', headerShown: false }} />
      <Stack.Screen name="LogContact" component={LogContactScreen} options={{ title: 'Log Contact' }} />
      <Stack.Screen name="GrievanceForm" component={GrievanceFormScreen} options={{ title: 'File Grievance' }} />
    </Stack.Navigator>
  );
}

function TasksStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="TasksList" component={TasksScreen} options={{ title: 'Tasks' }} />
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ title: 'New Task' }} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="MoreMenu" component={MoreMenu} options={{ title: 'More' }} />
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
      <Stack.Screen name="Resources" component={ResourcesScreen} options={{ title: 'Resources' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

export function StewardNavigator() {
  const { theme } = useTheme();
  const { colors } = theme;
  const { batchData } = useAuth();
  const badges = batchData?.badges;

  const TAB_ICONS: Record<string, string> = {
    Dashboard: 'grid',
    Cases: 'briefcase',
    Members: 'people',
    Tasks: 'checkbox',
    More: 'ellipsis-horizontal',
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
          <AnimatedTabIcon name={TAB_ICONS[route.name] || 'grid'} color={color} size={size} focused={focused} />
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarBadge: badges?.notifications ? (badges.notifications > 0 ? badges.notifications : undefined) : undefined,
        }}
      />
      <Tab.Screen
        name="Cases"
        component={CasesStack}
        options={{
          tabBarBadge: badges?.cases ? (badges.cases > 0 ? badges.cases : undefined) : undefined,
        }}
      />
      <Tab.Screen name="Members" component={MembersStack} />
      <Tab.Screen
        name="Tasks"
        component={TasksStack}
        options={{
          tabBarBadge: badges?.tasks ? (badges.tasks > 0 ? badges.tasks : undefined) : undefined,
        }}
      />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}

function MoreMenu({ navigation }: { navigation: { navigate: (s: string) => void } }) {
  const { theme } = useTheme();
  const { colors } = theme;

  const items = [
    { label: 'Insights & Analytics', icon: 'bar-chart', screen: 'Insights', iconBg: colors.primary },
    { label: 'Resources', icon: 'library', screen: 'Resources', iconBg: colors.accent },
    { label: 'Notifications', icon: 'notifications', screen: 'Notifications', iconBg: colors.warning },
    { label: 'Profile & Settings', icon: 'person-circle', screen: 'Profile', iconBg: colors.success },
  ];

  return (
    <ScrollView style={[moreStyles.container, { backgroundColor: colors.background }]}>
      {items.map(item => (
        <TouchableOpacity
          key={item.screen}
          style={[moreStyles.item, { borderBottomColor: colors.border }]}
          onPress={() => { hapticLight(); navigation.navigate(item.screen); }}
        >
          <View style={[moreStyles.iconBg, { backgroundColor: item.iconBg + '15' }]}>
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.iconBg} />
          </View>
          <Text style={[moreStyles.label, { color: colors.text }]}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const moreStyles = StyleSheet.create({
  container: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 16, fontWeight: '500' },
});
