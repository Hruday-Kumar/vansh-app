/**
 * 🪷 VANSH - Main Tab Navigator
 * Sacred pillars as navigation tabs
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { VanshColors, VanshSpacing, VanshSpring } from '../../src/theme';

// Custom tab bar icon with animation
function TabIcon({ 
  emoji, 
  focused, 
}: { 
  emoji: string; 
  focused: boolean;
}) {
  const scale = useSharedValue(focused ? 1.15 : 1);
  const opacity = useSharedValue(focused ? 1 : 0.6);
  
  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, VanshSpring.gentle);
    opacity.value = withSpring(focused ? 1 : 0.6, VanshSpring.gentle);
  }, [focused]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <View style={styles.tabIconContainer}>
      <Animated.Text style={[styles.tabEmoji, animatedStyle]}>
        {emoji}
      </Animated.Text>
      {focused && (
        <View style={styles.tabDot} />
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: VanshColors.suvarna[600],
        tabBarInactiveTintColor: VanshColors.masi[400],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        animation: 'shift',
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* Time River - Home Feed */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      
      {/* Smriti - Memories */}
      <Tabs.Screen
        name="smriti"
        options={{
          title: 'Smriti',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📸" focused={focused} />
          ),
        }}
      />
      
      {/* Katha - Stories */}
      <Tabs.Screen
        name="katha"
        options={{
          title: 'Katha',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎙️" focused={focused} />
          ),
        }}
      />
      
      {/* Vriksha - Family Tree */}
      <Tabs.Screen
        name="vriksha"
        options={{
          title: 'Vriksha',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🌳" focused={focused} />
          ),
        }}
      />
      
      {/* Parampara - Traditions */}
      <Tabs.Screen
        name="parampara"
        options={{
          title: 'Parampara',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🪔" focused={focused} />
          ),
        }}
      />
      
      {/* Vasiyat - Wisdom Vault */}
      <Tabs.Screen
        name="vasiyat"
        options={{
          title: 'Vasiyat',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💌" focused={focused} />
          ),
        }}
      />
      
      {/* Settings - User Profile & Preferences */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: VanshColors.khadi[50],
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[200],
    height: 80,
    paddingTop: VanshSpacing.xs,
    paddingBottom: VanshSpacing.md,
    shadowColor: VanshColors.masi[900],
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: -0.2,
  },
  tabItem: {
    paddingTop: 2,
    minWidth: 50,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: VanshColors.suvarna[500],
    marginTop: 2,
  },
});
