/**
 * 🪷 LOADING SPINNER
 * Beautiful loading indicator in Vansh style
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { VanshColors, VanshSpacing } from '../../theme';
import { SacredText } from './sacred-text';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'large',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const content = (
    <Animated.View 
      entering={FadeIn.duration(200)} 
      exiting={FadeOut.duration(200)}
      style={[styles.container, fullScreen && styles.fullScreen]}
    >
      <View style={styles.spinnerContainer}>
        <SacredText style={styles.lotus}>🪷</SacredText>
        <ActivityIndicator 
          size={size} 
          color={VanshColors.suvarna[500]} 
          style={styles.spinner}
        />
      </View>
      {message && (
        <SacredText variant="caption" color="muted" style={styles.message}>
          {message}
        </SacredText>
      )}
    </Animated.View>
  );
  
  if (fullScreen) {
    return (
      <View style={styles.overlay}>
        {content}
      </View>
    );
  }
  
  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: VanshSpacing.xl,
  },
  fullScreen: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(253, 251, 247, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotus: {
    fontSize: 32,
    marginBottom: VanshSpacing.sm,
  },
  spinner: {
    marginTop: VanshSpacing.sm,
  },
  message: {
    marginTop: VanshSpacing.md,
    textAlign: 'center',
  },
});
