// ============================================================================
// Haptics utility tests
// ============================================================================

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

import * as Haptics from 'expo-haptics';
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticWarning, hapticError, hapticSelection } from '../src/utils/haptics';

describe('Haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hapticLight calls impactAsync with Light', () => {
    hapticLight();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('hapticMedium calls impactAsync with Medium', () => {
    hapticMedium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('hapticHeavy calls impactAsync with Heavy', () => {
    hapticHeavy();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
  });

  it('hapticSuccess calls notificationAsync with Success', () => {
    hapticSuccess();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  it('hapticWarning calls notificationAsync with Warning', () => {
    hapticWarning();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
  });

  it('hapticError calls notificationAsync with Error', () => {
    hapticError();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
  });

  it('hapticSelection calls selectionAsync', () => {
    hapticSelection();
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });
});
