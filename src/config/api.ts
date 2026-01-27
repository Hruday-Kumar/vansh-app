/**
 * 🪷 API Configuration
 * Centralized API URL configuration for all environments
 */

import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Your computer's local IP address (update this to your IP)
const LOCAL_IP = '172.16.3.35';

// Determine the correct API URL based on platform and environment
function getApiUrl(): string {
  const port = 3000;
  
  // Web browser - use localhost
  if (Platform.OS === 'web') {
    return `http://localhost:${port}/api`;
  }
  
  // Check if running on a physical device
  const isPhysicalDevice = Device.isDevice;
  
  // Android emulator - use special IP that routes to host machine
  if (Platform.OS === 'android' && !isPhysicalDevice) {
    return `http://10.0.2.2:${port}/api`;
  }
  
  // iOS simulator - localhost works
  if (Platform.OS === 'ios' && !isPhysicalDevice) {
    return `http://localhost:${port}/api`;
  }
  
  // Physical device (Expo Go) - must use computer's local IP
  return `http://${LOCAL_IP}:${port}/api`;
}

export const API_URL = getApiUrl();

// Log the API URL on load
console.log('🌐 API_URL configured as:', API_URL);
console.log('📱 Platform:', Platform.OS, '| Physical device:', Device.isDevice);

export const API_CONFIG = {
  baseUrl: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};
