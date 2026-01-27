import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ErrorBoundary } from '../src/components/atoms/error-boundary';
import { OfflineBanner } from '../src/components/molecules/offline-banner';
import { LanguageProvider } from '../src/hooks/use-language';
import { initializeI18n } from '../src/i18n';
import { initializeAnalytics, initializeDeepLinks } from '../src/services';
import { loadPersistedCache, startCacheCleanup } from '../src/services/cache';
import { initializeMasterKey } from '../src/services/encryption';
import { initializeImageCache } from '../src/services/image-optimization';
import { initializePerformanceMonitoring, markAppReady, markStartupTime } from '../src/services/performance';
import { initNetworkMonitoring } from '../src/services/sync';
import { useAuthStore } from '../src/state';
import { VanshColors } from '../src/theme';

// Mark startup time as early as possible
markStartupTime();

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthNavigator() {
  const { isAuthenticated, token } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure navigation is ready
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!isReady) return;
    
    const inAuthGroup = segments[0] === 'login';
    
    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if already authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isReady]);
  
  return (
    <Stack
      screenOptions={{
        animation: 'fade',
        animationDuration: 200,
        contentStyle: { backgroundColor: VanshColors.khadi[50] },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: 'modal', 
          title: 'Modal',
          animation: 'slide_from_bottom',
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isHydrated, setIsHydrated] = useState(false);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  
  useEffect(() => {
    // Initialize app services
    const initializeServices = async () => {
      try {
        // Initialize network monitoring for offline sync
        await initNetworkMonitoring();
        
        // Initialize encryption keys
        await initializeMasterKey();
        
        // Initialize i18n (language support)
        await initializeI18n();
        
        // Initialize analytics (privacy-first)
        await initializeAnalytics({ debug: __DEV__ });
        
        // Initialize deep linking
        await initializeDeepLinks();
        
        // Phase 5: Performance & Caching Services
        // Initialize image cache
        await initializeImageCache();
        
        // Load persisted memory cache
        await loadPersistedCache();
        
        // Start automatic cache cleanup (every 60 seconds)
        startCacheCleanup(60000);
        
        // Initialize performance monitoring (FPS tracking in dev)
        initializePerformanceMonitoring({ 
          fps: __DEV__, 
          memory: false,
          logReport: __DEV__ 
        });
        
        // Mark app as ready for performance tracking
        markAppReady();
        
        console.log('🪷 Vansh services initialized');
      } catch (error) {
        console.error('Failed to initialize services:', error);
      } finally {
        setServicesInitialized(true);
      }
    };
    
    initializeServices();
  }, []);
  
  useEffect(() => {
    // Wait for zustand store to hydrate
    const timer = setTimeout(() => setIsHydrated(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  if (!isHydrated || !servicesInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VanshColors.khadi[50] }}>
        <ActivityIndicator size="large" color={VanshColors.suvarna[500]} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <OfflineBanner />
            <AuthNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </GestureHandlerRootView>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
