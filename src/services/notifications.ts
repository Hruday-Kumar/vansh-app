/**
 * 🪷 PUSH NOTIFICATION SERVICE
 * Handles push notifications for iOS and Android
 * NOTE: Push notifications don't work in Expo Go - requires development build
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Check if running in Expo Go (where push notifications don't work)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import notifications to avoid Expo Go crash
let Notifications: typeof import('expo-notifications') | null = null;

// Only configure notifications if NOT in Expo Go
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    
    // Configure how notifications are handled when app is in foreground
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('expo-notifications not available:', e);
  }
}

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface PushNotificationToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

export interface NotificationData {
  type: 'memory_shared' | 'katha_received' | 'vasiyat_reminder' | 'family_update' | 'general';
  entityId?: string;
  entityType?: string;
  deepLink?: string;
  [key: string]: unknown;
}

export interface LocalNotificationOptions {
  title: string;
  body: string;
  data?: NotificationData;
  trigger?: any;
  sound?: boolean;
  badge?: number;
}

// ═══════════════════════════════════════════════════════════
// PUSH TOKEN REGISTRATION
// ═══════════════════════════════════════════════════════════

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotifications(): Promise<PushNotificationToken | null> {
  // Notifications don't work in Expo Go
  if (isExpoGo || !Notifications) {
    console.warn('Push notifications not available in Expo Go. Use a development build.');
    return null;
  }
  
  // Notifications only work on physical devices
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  try {
    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    // Get Expo push token (works for both iOS and Android via Expo's push service)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await setupAndroidChannels();
    }

    console.log('📱 Push token:', tokenData.data);
    return {
      token: tokenData.data,
      type: 'expo',
    };
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Get device push token (FCM for Android, APNs for iOS)
 * Use this if you want to send notifications directly without Expo's push service
 */
export async function getDevicePushToken(): Promise<PushNotificationToken | null> {
  if (!Device.isDevice || isExpoGo || !Notifications) return null;

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return {
      token: tokenData.data as string,
      type: Platform.OS === 'ios' ? 'apns' : 'fcm',
    };
  } catch (error) {
    console.error('Failed to get device push token:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// ANDROID NOTIFICATION CHANNELS
// ═══════════════════════════════════════════════════════════

async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android' || !Notifications) return;

  // Family updates channel
  await Notifications.setNotificationChannelAsync('family', {
    name: 'परिवार अपडेट',
    description: 'Family tree and member updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D97706',
  });

  // Memories channel
  await Notifications.setNotificationChannelAsync('memories', {
    name: 'स्मृति',
    description: 'Memory sharing notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C3AED',
  });

  // Katha channel
  await Notifications.setNotificationChannelAsync('katha', {
    name: 'कथा',
    description: 'Voice story notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#059669',
  });

  // Vasiyat channel
  await Notifications.setNotificationChannelAsync('vasiyat', {
    name: 'वसीयत',
    description: 'Testament and legacy notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#DC2626',
  });

  // General channel
  await Notifications.setNotificationChannelAsync('general', {
    name: 'सामान्य',
    description: 'General notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#0EA5E9',
  });
}

// ═══════════════════════════════════════════════════════════
// LOCAL NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(options: LocalNotificationOptions): Promise<string> {
  if (isExpoGo || !Notifications) {
    console.warn('Notifications not available in Expo Go');
    return '';
  }
  
  const { title, body, data, trigger, sound = true, badge } = options;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as Record<string, unknown>,
      sound: sound ? 'default' : undefined,
      badge,
    },
    trigger: trigger ?? null, // null = immediate
  });

  return notificationId;
}

/**
 * Schedule a notification for a specific date
 */
export async function scheduleNotificationAt(
  options: Omit<LocalNotificationOptions, 'trigger'>,
  date: Date
): Promise<string> {
  if (!Notifications) return '';
  return scheduleLocalNotification({
    ...options,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

/**
 * Schedule a daily reminder
 */
export async function scheduleDailyReminder(
  options: Omit<LocalNotificationOptions, 'trigger'>,
  hour: number,
  minute: number
): Promise<string> {
  if (!Notifications) return '';
  return scheduleLocalNotification({
    ...options,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

/**
 * Cancel a specific notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<any[]> {
  if (!Notifications) return [];
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set badge count (iOS only, Android uses channels)
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (!Notifications) return;
  await Notifications.setBadgeCountAsync(count);
}

// ═══════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Hook to handle push notifications
 */
export function usePushNotifications(options?: {
  onNotificationReceived?: (notification: any) => void;
  onNotificationResponse?: (response: any) => void;
}): {
  pushToken: string | null;
  permissionStatus: string | null;
  registerForPush: () => Promise<void>;
} {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const registerForPush = async () => {
    const result = await registerForPushNotifications();
    if (result) {
      setPushToken(result.token);
      setPermissionStatus('granted');
    }
  };

  useEffect(() => {
    if (isExpoGo || !Notifications) return;
    
    // Check permission status on mount
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermissionStatus(status);
    });

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      options?.onNotificationReceived?.(notification);
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      options?.onNotificationResponse?.(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [options?.onNotificationReceived, options?.onNotificationResponse]);

  return {
    pushToken,
    permissionStatus,
    registerForPush,
  };
}

/**
 * Hook to get the last notification response (for deep linking)
 */
export function useLastNotificationResponse(): any | null {
  const [lastResponse, setLastResponse] = useState<any | null>(null);

  useEffect(() => {
    if (isExpoGo || !Notifications) return;
    
    // Get initial notification response (if app was opened via notification)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        setLastResponse(response);
      }
    });
  }, []);

  return lastResponse;
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATION BUILDERS (Vansh-specific)
// ═══════════════════════════════════════════════════════════

export const VanshNotifications = {
  /**
   * Notify when a memory is shared
   */
  async memoryShared(senderName: string, memoryId: string): Promise<string> {
    return scheduleLocalNotification({
      title: '📷 नई स्मृति साझा की गई',
      body: `${senderName} ने आपके साथ एक स्मृति साझा की है`,
      data: {
        type: 'memory_shared',
        entityId: memoryId,
        entityType: 'memory',
        deepLink: `/smriti/${memoryId}`,
      },
    });
  },

  /**
   * Notify when a katha is received
   */
  async kathaReceived(senderName: string, kathaId: string): Promise<string> {
    return scheduleLocalNotification({
      title: '🎤 नई कथा प्राप्त',
      body: `${senderName} ने एक कहानी रिकॉर्ड की है`,
      data: {
        type: 'katha_received',
        entityId: kathaId,
        entityType: 'katha',
        deepLink: `/katha/${kathaId}`,
      },
    });
  },

  /**
   * Reminder for pending vasiyat
   */
  async vasiyatReminder(): Promise<string> {
    return scheduleLocalNotification({
      title: '📜 वसीयत अनुस्मारक',
      body: 'आपकी विरासत का दस्तावेज़ीकरण करने का समय',
      data: {
        type: 'vasiyat_reminder',
        entityType: 'vasiyat',
        deepLink: '/vasiyat',
      },
    });
  },

  /**
   * Family tree update notification
   */
  async familyUpdate(updateType: string, memberId: string): Promise<string> {
    return scheduleLocalNotification({
      title: '👨‍👩‍👧‍👦 परिवार वृक्ष अपडेट',
      body: `आपके परिवार वृक्ष में ${updateType} किया गया`,
      data: {
        type: 'family_update',
        entityId: memberId,
        entityType: 'member',
        deepLink: `/vriksha/member/${memberId}`,
      },
    });
  },
};
