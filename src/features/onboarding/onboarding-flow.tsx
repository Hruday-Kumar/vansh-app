/**
 * 🪷 VANSH - Onboarding Flow
 * Beautiful introduction to the app for new users
 */

import React, { useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
    Extrapolation,
    FadeInUp,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { VanshColors, VanshRadius, VanshSpacing, VanshTextStyles } from '../../theme';

// ============================================================================
// Types
// ============================================================================

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

// ============================================================================
// Data
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides: OnboardingSlide[] = [
  {
    id: 'welcome',
    emoji: '🪷',
    title: 'Welcome to Vansh',
    subtitle: 'Your Digital Heirloom',
    description: 'Preserve your family\'s legacy for generations. Every memory, story, and tradition—safe forever.',
    color: VanshColors.suvarna[500],
  },
  {
    id: 'smriti',
    emoji: '📸',
    title: 'Smriti',
    subtitle: 'Eternal Memories',
    description: 'Organize photos by family events and members. Add context that transforms pictures into living memories.',
    color: VanshColors.sindoor[500],
  },
  {
    id: 'katha',
    emoji: '🎙️',
    title: 'Katha',
    subtitle: 'Voice Stories',
    description: 'Record elders\' stories in their own voice. AI transcription and translation ensure nothing is lost.',
    color: VanshColors.neelam[600],
  },
  {
    id: 'vriksha',
    emoji: '🌳',
    title: 'Vriksha',
    subtitle: 'Family Tree',
    description: 'Beautiful, interactive family trees with rich member profiles spanning generations.',
    color: VanshColors.neelam[500],
  },
  {
    id: 'parampara',
    emoji: '🪔',
    title: 'Parampara',
    subtitle: 'Living Traditions',
    description: 'Document recipes, rituals, and customs. Preserve the "how" and "why" of your family\'s traditions.',
    color: VanshColors.chandan[600],
  },
  {
    id: 'vasiyat',
    emoji: '💌',
    title: 'Vasiyat',
    subtitle: 'Wisdom Vault',
    description: 'Create time-locked messages for future generations. Life lessons, blessings, and love—delivered when the time is right.',
    color: VanshColors.padma[600],
  },
];

// ============================================================================
// Dot Indicator
// ============================================================================

interface DotIndicatorProps {
  total: number;
  current: number;
  activeColor: string;
}

function DotIndicator({ total, current, activeColor }: DotIndicatorProps) {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === current;
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: isActive ? activeColor : VanshColors.khadi[300],
                width: isActive ? 24 : 8,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ============================================================================
// Slide Component
// ============================================================================

interface SlideProps {
  slide: OnboardingSlide;
  index: number;
  scrollX: SharedValue<number>;
}

function Slide({ slide, index, scrollX }: SlideProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
          <Text style={styles.icon}>{slide.emoji}</Text>
        </View>

        {/* Text */}
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
        <Text style={[styles.title, { color: slide.color }]}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Main Onboarding Component
// ============================================================================

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  // Handle scroll
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  }, [currentIndex]);

  // Go to next slide
  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex, isLastSlide, onComplete]);

  // Skip to end
  const handleSkip = useCallback(() => {
    onSkip?.() ?? onComplete();
  }, [onSkip, onComplete]);

  // Button animation
  const buttonStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(currentSlide.color, { duration: 300 }),
    };
  });

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {!isLastSlide && (
        <Animated.View entering={FadeInUp.delay(500)} style={styles.skipContainer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <Slide slide={item} index={index} scrollX={scrollX} />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <DotIndicator
          total={slides.length}
          current={currentIndex}
          activeColor={currentSlide.color}
        />

        {/* Continue Button */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLastSlide ? 'Get Started' : 'Continue'}
            </Text>
            <Text style={styles.buttonArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Family Quote */}
        <Text style={styles.quote}>
          "परिवार ही धन है" — Family is wealth
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  skipContainer: {
    position: 'absolute',
    top: VanshSpacing.xl + 10,
    right: VanshSpacing.md,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.sm,
  },
  skipText: {
    ...VanshTextStyles.body,
    color: VanshColors.masi[500],
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: VanshSpacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 340,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: VanshSpacing.xl,
  },
  icon: {
    fontSize: 56,
  },
  subtitle: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[500],
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: VanshSpacing.xs,
  },
  title: {
    ...VanshTextStyles.hero,
    textAlign: 'center',
    marginBottom: VanshSpacing.md,
  },
  description: {
    ...VanshTextStyles.body,
    color: VanshColors.masi[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: VanshSpacing.xl,
    paddingBottom: VanshSpacing['2xl'],
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: VanshSpacing.xl,
    gap: VanshSpacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    width: '100%',
    borderRadius: VanshRadius.lg,
    marginBottom: VanshSpacing.lg,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: VanshSpacing.md,
    gap: VanshSpacing.sm,
  },
  buttonText: {
    ...VanshTextStyles.subhead,
    fontWeight: '600',
    color: VanshColors.khadi[50],
  },
  buttonArrow: {
    fontSize: 20,
    color: VanshColors.khadi[50],
  },
  quote: {
    ...VanshTextStyles.caption,
    color: VanshColors.masi[400],
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
