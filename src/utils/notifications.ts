// ============================================================================
// Push Notifications - Setup and management
// ============================================================================

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/** Configure notification handler */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Register for push notifications and return the Expo push token */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DDS Dashboard',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a237e',
    });

    await Notifications.setNotificationChannelAsync('deadlines', {
      name: 'Deadline Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Grievance deadline reminders',
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return token.data;
  } catch {
    return null;
  }
}

/** Schedule a local notification (e.g., deadline reminder) */
export async function scheduleDeadlineReminder(
  title: string,
  body: string,
  triggerDate: Date,
  identifier?: string,
): Promise<string> {
  const secondsUntil = Math.max(1, Math.floor((triggerDate.getTime() - Date.now()) / 1000));

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: { type: 'deadline' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntil,
    },
    identifier,
  });
}

/** Cancel all scheduled notifications */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Get the badge count */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/** Set the badge count */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}
