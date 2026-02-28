/**
 * VANSH - Main Tab Navigator
 * Clean 4-tab layout: Home, Memories, Tree, More
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VanshColors } from '../../src/theme';

// Simple tab icon - no animations for better perf
function TabIcon({ 
  iconName, 
  focused, 
}: { 
  iconName: keyof typeof MaterialIcons.glyphMap; 
  focused: boolean;
}) {
  return (
    <View style={styles.tabIconContainer}>
      <MaterialIcons 
        name={iconName} 
        size={24} 
        color={focused ? VanshColors.suvarna[600] : VanshColors.masi[400]} 
      />
      {focused && (
        <View style={styles.tabIndicator} />
      )}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { 
          paddingBottom: bottomPadding,
          height: 60 + bottomPadding,
          marginHorizontal: 16,
          marginBottom: Platform.OS === 'ios' ? 0 : 12,
        }],
        tabBarActiveTintColor: VanshColors.suvarna[600],
        tabBarInactiveTintColor: VanshColors.masi[400],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        animation: 'shift',
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* Home - Dashboard Feed */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="home" focused={focused} />
          ),
        }}
      />
      
      {/* Memories - Photos & Stories */}
      <Tabs.Screen
        name="smriti"
        options={{
          title: 'Memories',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="photo-library" focused={focused} />
          ),
        }}
      />
      
      {/* Katha - Hidden, accessed from Memories */}
      <Tabs.Screen
        name="katha"
        options={{
          href: null,
        }}
      />
      
      {/* Family Tree */}
      <Tabs.Screen
        name="vriksha"
        options={{
          title: 'Tree',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="account-tree" focused={focused} />
          ),
        }}
      />
      
      {/* Parampara - Hidden, accessed from More */}
      <Tabs.Screen
        name="parampara"
        options={{
          href: null,
        }}
      />
      
      {/* Vasiyat - Hidden, accessed from More */}
      <Tabs.Screen
        name="vasiyat"
        options={{
          href: null,
        }}
      />
      
      {/* More Hub - Settings, Traditions, Vault, etc. */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="apps" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopWidth: 0,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  tabItem: {
    paddingTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  tabIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: VanshColors.suvarna[500],
    marginTop: 3,
  },
});
