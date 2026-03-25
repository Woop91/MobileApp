// ============================================================================
// Haptic Feedback - Tactile responses for interactions
// ============================================================================

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Light tap — button press, tab switch, chip select */
export async function hapticLight() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

/** Medium tap — card press, list item select */
export async function hapticMedium() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

/** Heavy tap — destructive actions, important state changes */
export async function hapticHeavy() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
}

/** Success — form submit, task complete, login success */
export async function hapticSuccess() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

/** Warning — overdue deadline, validation error */
export async function hapticWarning() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
}

/** Error — failed action, network error */
export async function hapticError() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {}
}

/** Selection tick — scrolling through picker, adjusting slider */
export async function hapticSelection() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {}
}
