import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

let permissionGranted = false;

/**
 * Check and request notification permission
 * Call this on app startup
 */
export async function initNotifications(): Promise<boolean> {
  permissionGranted = await isPermissionGranted();

  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }

  return permissionGranted;
}

/**
 * Send a notification for timer completion
 */
export async function notifyTimerComplete(mode: 'work' | 'shortBreak' | 'longBreak') {
  if (!permissionGranted) {
    permissionGranted = await isPermissionGranted();
  }

  if (!permissionGranted) return;

  const titles = {
    work: 'Focus session complete!',
    shortBreak: 'Break is over',
    longBreak: 'Long break is over',
  };

  const bodies = {
    work: 'Time for a break. Great work!',
    shortBreak: 'Ready to focus again?',
    longBreak: 'Ready to get back to work?',
  };

  sendNotification({
    title: titles[mode],
    body: bodies[mode],
  });
}