/**
 * 🪷 MEMBER AVATAR - Family member profile picture with Prana glow
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useHeartbeatPulse } from '../../hooks';
import { VanshColors, VanshShadows } from '../../theme';
import { SacredText } from '../atoms/sacred-text';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface MemberAvatarProps {
  uri?: string;
  name: string;
  size?: AvatarSize;
  isAlive?: boolean;
  hasNewActivity?: boolean;
  pranaStrength?: number; // 0-1, controls glow intensity
  showName?: boolean;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 32,
  sm: 40,
  md: 56,
  lg: 80,
  xl: 120,
};

const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function MemberAvatar({
  uri,
  name,
  size = 'md',
  isAlive = true,
  hasNewActivity = false,
  pranaStrength = 0,
  showName = false,
  style,
}: MemberAvatarProps) {
  const pulseStyle = useHeartbeatPulse(hasNewActivity);
  
  const dimension = sizeMap[size];
  const borderRadius = dimension / 2;
  
  // Calculate glow based on prana strength
  const glowOpacity = pranaStrength * 0.6;
  const glowColor = isAlive ? VanshColors.suvarna[500] : VanshColors.masi[400];
  
  return (
    <View style={[styles.container, style]}>
      {/* Prana glow ring */}
      {pranaStrength > 0 && (
        <View
          style={[
            styles.glowRing,
            {
              width: dimension + 8,
              height: dimension + 8,
              borderRadius: (dimension + 8) / 2,
              borderColor: glowColor,
              opacity: glowOpacity,
            },
          ]}
        />
      )}
      
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            width: dimension,
            height: dimension,
            borderRadius,
          },
          hasNewActivity && pulseStyle,
          !isAlive && styles.deceased,
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.image, { borderRadius }]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                borderRadius,
                backgroundColor: isAlive
                  ? VanshColors.suvarna[100]
                  : VanshColors.masi[200],
              },
            ]}
          >
            <SacredText
              variant={size === 'xs' || size === 'sm' ? 'caption' : 'subhead'}
              color={isAlive ? 'gold' : 'muted'}
            >
              {getInitials(name)}
            </SacredText>
          </View>
        )}
        
        {/* Deceased indicator */}
        {!isAlive && (
          <View style={styles.deceasedBadge}>
            <SacredText variant="caption" style={styles.deceasedIcon}>
              🪷
            </SacredText>
          </View>
        )}
        
        {/* New activity indicator */}
        {hasNewActivity && (
          <View style={styles.activityDot} />
        )}
      </Animated.View>
      
      {/* Name label */}
      {showName && (
        <SacredText
          variant="caption"
          color={isAlive ? 'primary' : 'muted'}
          style={styles.name}
          numberOfLines={1}
        >
          {name}
        </SacredText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  avatarContainer: {
    overflow: 'hidden',
    ...VanshShadows.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deceased: {
    opacity: 0.85,
  },
  deceasedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: VanshColors.khadi[50],
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deceasedIcon: {
    fontSize: 12,
  },
  activityDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: VanshColors.semantic.fresh,
    borderWidth: 2,
    borderColor: VanshColors.khadi[50],
  },
  name: {
    marginTop: 4,
    maxWidth: 80,
    textAlign: 'center',
  },
});
