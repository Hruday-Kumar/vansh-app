/**
 * 🪷 ERROR DISPLAY
 * Beautiful error message display
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { VanshColors, VanshSpacing } from '../theme';
import { SacredText } from './atoms/sacred-text';
import { SilkButton } from './atoms/silk-button';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorDisplay({ 
  title = 'Something went wrong',
  message, 
  onRetry,
  fullScreen = false 
}: ErrorDisplayProps) {
  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={[styles.container, fullScreen && styles.fullScreen]}
    >
      <View style={styles.iconContainer}>
        <SacredText style={styles.icon}>😔</SacredText>
      </View>
      
      <SacredText variant="heading" color="primary" align="center" style={styles.title}>
        {title}
      </SacredText>
      
      <SacredText variant="body" color="secondary" align="center" style={styles.message}>
        {message}
      </SacredText>
      
      {onRetry && (
        <SilkButton
          variant="secondary"
          label="Try Again"
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: VanshSpacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: VanshColors.sindoor[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: VanshSpacing.lg,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    marginBottom: VanshSpacing.sm,
  },
  message: {
    marginBottom: VanshSpacing.lg,
    maxWidth: 280,
  },
  retryButton: {
    minWidth: 150,
  },
});
