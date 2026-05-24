// ============================================================================
// Calendar Integration - Grievance deadline events
// ============================================================================

import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

const CALENDAR_NAME = 'GroupUp Grievance Deadlines';

/** Get or create the DDS calendar */
async function getOrCreateCalendar(): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Calendar access is needed to manage deadline reminders.');
    return null;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find(c => c.title === CALENDAR_NAME);
  if (existing) return existing.id;

  // Create a new calendar
  const defaultCalendarSource =
    Platform.OS === 'ios'
      ? calendars.find(c => c.source?.isLocalAccount)?.source
      : { isLocalAccount: true, name: CALENDAR_NAME, type: Calendar.CalendarType.LOCAL as unknown as string };

  if (!defaultCalendarSource) return null;

  const newCalId = await Calendar.createCalendarAsync({
    title: CALENDAR_NAME,
    color: '#1e3a8a',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: (defaultCalendarSource as { id?: string }).id,
    source: defaultCalendarSource as Calendar.Source,
    name: CALENDAR_NAME,
    ownerAccount: 'GroupUp',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });

  return newCalId;
}

/** Add a grievance deadline to the calendar */
export async function addDeadlineEvent(params: {
  caseId: string;
  title: string;
  deadline: Date;
  notes?: string;
}): Promise<string | null> {
  try {
    const calId = await getOrCreateCalendar();
    if (!calId) return null;

    const eventId = await Calendar.createEventAsync(calId, {
      title: `[${params.caseId}] ${params.title}`,
      startDate: params.deadline,
      endDate: new Date(params.deadline.getTime() + 60 * 60 * 1000), // 1 hour
      notes: params.notes || `Grievance deadline for case ${params.caseId}`,
      alarms: [
        { relativeOffset: -24 * 60 }, // 1 day before
        { relativeOffset: -60 },       // 1 hour before
      ],
      timeZone: 'America/New_York',
    });

    return eventId;
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return null;
  }
}

