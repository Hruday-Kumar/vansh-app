/**
 * 🪷 VANSH REANIMATED HOOKS
 * Custom animation hooks for "Digital Silk" motion
 */

import { useCallback, useEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
    cancelAnimation,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { VanshDuration, VanshEasing, VanshSpring } from '../theme';

// ═══════════════════════════════════════════════════════════
// HEARTBEAT PULSE - For living connections
// ═══════════════════════════════════════════════════════════

export function useHeartbeatPulse(isActive: boolean = true) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 400 }),
          withTiming(1, { duration: 600 })
        ),
        -1, // infinite
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 400 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1);
      opacity.value = withTiming(1);
    }
  }, [isActive]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return animatedStyle;
}

// ═══════════════════════════════════════════════════════════
// SILK PRESS - Fluid press feedback
// ═══════════════════════════════════════════════════════════

export function useSilkPress() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.97, VanshSpring.stiff);
    opacity.value = withTiming(0.9, { duration: VanshDuration.instant });
  }, []);
  
  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, VanshSpring.bouncy);
    opacity.value = withTiming(1, { duration: VanshDuration.fast });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return { animatedStyle, onPressIn, onPressOut };
}

// ═══════════════════════════════════════════════════════════
// PAGE FLIP - Book-like page turn physics
// ═══════════════════════════════════════════════════════════

export function usePageFlip() {
  const rotateY = useSharedValue(0);
  const progress = useSharedValue(0);
  
  const flipForward = useCallback(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: VanshDuration.dramatic,
      easing: VanshEasing.pageFlip,
    });
    rotateY.value = withTiming(180, {
      duration: VanshDuration.dramatic,
      easing: VanshEasing.pageFlip,
    });
  }, []);
  
  const flipBack = useCallback(() => {
    progress.value = 1;
    progress.value = withTiming(0, {
      duration: VanshDuration.dramatic,
      easing: VanshEasing.pageFlip,
    });
    rotateY.value = withTiming(0, {
      duration: VanshDuration.dramatic,
      easing: VanshEasing.pageFlip,
    });
  }, []);
  
  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 0.5], [0, -90], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotate}deg` },
      ],
      opacity: progress.value < 0.5 ? 1 : 0,
      backfaceVisibility: 'hidden',
    };
  });
  
  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0.5, 1], [90, 0], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotate}deg` },
      ],
      opacity: progress.value >= 0.5 ? 1 : 0,
      backfaceVisibility: 'hidden',
    };
  });
  
  return { frontStyle, backStyle, flipForward, flipBack, progress };
}

// ═══════════════════════════════════════════════════════════
// ENTRANCE ANIMATION - Staggered reveal
// ═══════════════════════════════════════════════════════════

export function useEntranceAnimation(delay: number = 0) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, {
      duration: VanshDuration.slow,
      easing: VanshEasing.enter,
    }));
    translateY.value = withDelay(delay, withSpring(0, VanshSpring.heavy));
  }, [delay]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return animatedStyle;
}

// ═══════════════════════════════════════════════════════════
// SHIMMER - Golden glow for sacred elements
// ═══════════════════════════════════════════════════════════

export function useGoldenShimmer(isActive: boolean = true) {
  const shimmerOpacity = useSharedValue(0.4);
  
  useEffect(() => {
    if (isActive) {
      shimmerOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.4, { duration: 1500 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(shimmerOpacity);
      shimmerOpacity.value = withTiming(0);
    }
  }, [isActive]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));
  
  return animatedStyle;
}

// ═══════════════════════════════════════════════════════════
// FLOAT - Ethereal floating motion
// ═══════════════════════════════════════════════════════════

export function useFloatAnimation(amplitude: number = 8) {
  const translateY = useSharedValue(0);
  
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration: 2000, easing: VanshEasing.water }),
        withTiming(0, { duration: 2000, easing: VanshEasing.water })
      ),
      -1,
      true
    );
  }, [amplitude]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  
  return animatedStyle;
}

// ═══════════════════════════════════════════════════════════
// SWIPE GESTURE - For fluid page/card swiping
// ═══════════════════════════════════════════════════════════

interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipeGesture(config: SwipeGestureConfig) {
  const translateX = useSharedValue(0);
  const { onSwipeLeft, onSwipeRight, threshold = 100 } = config;
  
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.5; // Resistance
    })
    .onEnd((event) => {
      if (event.translationX < -threshold && onSwipeLeft) {
        runOnJS(onSwipeLeft)();
      } else if (event.translationX > threshold && onSwipeRight) {
        runOnJS(onSwipeRight)();
      }
      translateX.value = withSpring(0, VanshSpring.heavy);
    });
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return { gesture, animatedStyle };
}

// ═══════════════════════════════════════════════════════════
// TIME-RIVER SCROLL - Horizontal timeline with era detection
// ═══════════════════════════════════════════════════════════

interface TimeRiverConfig {
  totalWidth: number;
  eras: Array<{ start: number; end: number; name: string }>;
  onEraChange?: (era: string) => void;
}

export function useTimeRiverScroll(config: TimeRiverConfig) {
  const scrollX = useSharedValue(0);
  const currentEraIndex = useSharedValue(0);
  const { eras, onEraChange } = config;
  
  const onScroll = useCallback((x: number) => {
    'worklet';
    scrollX.value = x;
    
    // Detect current era based on scroll position
    for (let i = 0; i < eras.length; i++) {
      if (x >= eras[i].start && x < eras[i].end) {
        if (currentEraIndex.value !== i) {
          currentEraIndex.value = i;
          if (onEraChange) {
            runOnJS(onEraChange)(eras[i].name);
          }
        }
        break;
      }
    }
  }, [eras, onEraChange]);
  
  const backgroundStyle = useAnimatedStyle(() => {
    // Interpolate background color based on era
    const opacity = interpolate(
      scrollX.value % 500,
      [0, 250, 500],
      [0.8, 1, 0.8]
    );
    return { opacity };
  });
  
  return { scrollX, onScroll, backgroundStyle, currentEraIndex };
}

// ═══════════════════════════════════════════════════════════
// WAVEFORM ANIMATION - For audio visualization
// ═══════════════════════════════════════════════════════════

export function useWaveformAnimation(
  waveformData: number[],
  isPlaying: boolean,
  currentPosition: number
) {
  const playheadPosition = useSharedValue(0);
  
  useEffect(() => {
    if (isPlaying) {
      playheadPosition.value = withTiming(currentPosition, {
        duration: 100,
      });
    }
  }, [currentPosition, isPlaying]);
  
  const getBarStyle = useCallback((index: number, total: number) => {
    'worklet';
    const barPosition = index / total;
    const isActive = barPosition <= playheadPosition.value;
    
    return {
      opacity: isActive ? 1 : 0.4,
      backgroundColor: isActive ? '#D4AF37' : '#8E8573',
    };
  }, []);
  
  return { playheadPosition, getBarStyle };
}
