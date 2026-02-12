/**
 * 🌳 ANIMATED CONNECTION LINES - Stunning Visual Connections
 * ═══════════════════════════════════════════════════════════
 * 
 * Features:
 * ✓ Animated pulse effect on connections
 * ✓ Gradient lines for different relationship types
 * ✓ Heart symbol for spouse connections
 * ✓ Bracket-style parent-child connectors
 * ✓ Glow effect on highlighted paths
 * ✓ Smooth entrance animations
 * 
 * PHILOSOPHY: "Connections are the threads that weave souls together"
 */

import React, { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { Connector } from './types';

// ═══════════════════════════════════════════════════════════
// ANIMATED SVG COMPONENTS
// ═══════════════════════════════════════════════════════════

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface AnimatedConnectionLinesProps {
  connectors: Connector[];
  highlightedPath: string[];
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

// ═══════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════

const CONNECTION_COLORS = {
  'parent-child': {
    normal: '#6366F1',
    highlighted: '#4F46E5',
    glow: 'rgba(99, 102, 241, 0.5)',
  },
  spouse: {
    normal: '#EC4899',
    highlighted: '#DB2777',
    glow: 'rgba(236, 72, 153, 0.5)',
  },
  sibling: {
    normal: '#10B981',
    highlighted: '#059669',
    glow: 'rgba(16, 185, 129, 0.5)',
  },
};

// ═══════════════════════════════════════════════════════════
// SPOUSE CONNECTION (Horizontal with animated heart)
// ═══════════════════════════════════════════════════════════

interface SpouseConnectionProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isHighlighted: boolean;
  index: number;
}

const SpouseConnection = memo(function SpouseConnection({
  x1,
  y1,
  x2,
  y2,
  isHighlighted,
  index,
}: SpouseConnectionProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // Animation values
  const dashOffset = useSharedValue(0);
  const heartScale = useSharedValue(1);
  const heartOpacity = useSharedValue(1);
  
  useEffect(() => {
    if (isHighlighted) {
      // Animated dash moving
      dashOffset.value = withRepeat(
        withTiming(-20, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
      
      // Heart pulse
      heartScale.value = withRepeat(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      dashOffset.value = 0;
      heartScale.value = 1;
    }
  }, [isHighlighted]);
  
  const lineAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));
  
  const heartAnimatedProps = useAnimatedProps(() => ({
    transform: [{ scale: heartScale.value }],
  }));
  
  const colors = CONNECTION_COLORS.spouse;
  const lineColor = isHighlighted ? colors.highlighted : colors.normal;
  
  return (
    <G>
      {/* Glow effect */}
      {isHighlighted && (
        <Line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.glow}
          strokeWidth={8}
          strokeLinecap="round"
        />
      )}
      
      {/* Main line */}
      <AnimatedLine
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={lineColor}
        strokeWidth={isHighlighted ? 4 : 3}
        strokeLinecap="round"
        strokeDasharray={isHighlighted ? '10,5' : undefined}
        animatedProps={lineAnimatedProps}
      />
      
      {/* Heart circle */}
      <Circle
        cx={midX}
        cy={midY}
        r={12}
        fill="#FFF"
        stroke={lineColor}
        strokeWidth={2}
      />
      
      {/* Heart emoji */}
      <SvgText
        x={midX}
        y={midY + 5}
        fontSize={12}
        textAnchor="middle"
        fill={lineColor}
      >
        ❤️
      </SvgText>
    </G>
  );
});

// ═══════════════════════════════════════════════════════════
// BRACKET CONNECTION (Parent to multiple children)
// ═══════════════════════════════════════════════════════════

interface BracketConnectionProps {
  parentX: number;
  parentY: number;
  children: Array<{ x: number; y: number; id: string }>;
  isHighlighted: boolean;
  index: number;
}

const BracketConnection = memo(function BracketConnection({
  parentX,
  parentY,
  children,
  isHighlighted,
  index,
}: BracketConnectionProps) {
  if (children.length === 0) return null;
  
  const dashOffset = useSharedValue(0);
  
  useEffect(() => {
    if (isHighlighted) {
      dashOffset.value = withRepeat(
        withTiming(-20, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      dashOffset.value = 0;
    }
  }, [isHighlighted]);
  
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));
  
  const colors = CONNECTION_COLORS['parent-child'];
  const lineColor = isHighlighted ? colors.highlighted : colors.normal;
  const strokeWidth = isHighlighted ? 3 : 2;
  
  // Calculate bracket geometry
  const minChildX = Math.min(...children.map(c => c.x));
  const maxChildX = Math.max(...children.map(c => c.x));
  const childY = children[0].y;
  
  // Midpoint between parent and children
  const midY = parentY + (childY - parentY) / 2;
  
  // Build path for bracket
  let pathData = `M ${parentX} ${parentY}`;
  pathData += ` L ${parentX} ${midY}`;
  
  // Horizontal bar (only when multiple children)
  if (children.length > 1) {
    // Draw left part of horizontal bar
    pathData += ` M ${minChildX} ${midY}`;
    pathData += ` L ${maxChildX} ${midY}`;
    // Move back to parent drop point for clean path
    pathData += ` M ${parentX} ${midY}`;
  }
  
  return (
    <G>
      {/* Glow effect */}
      {isHighlighted && (
        <Path
          d={pathData}
          stroke={colors.glow}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
      
      {/* Main bracket line */}
      <AnimatedPath
        d={pathData}
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={isHighlighted ? '10,5' : undefined}
        animatedProps={animatedProps}
      />
      
      {/* Individual drops to each child */}
      {children.map((child, i) => (
        <G key={`child-drop-${i}`}>
          {isHighlighted && (
            <Line
              x1={child.x}
              y1={midY}
              x2={child.x}
              y2={child.y}
              stroke={colors.glow}
              strokeWidth={8}
              strokeLinecap="round"
            />
          )}
          <Line
            x1={child.x}
            y1={midY}
            x2={child.x}
            y2={child.y}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </G>
      ))}
    </G>
  );
});

// ═══════════════════════════════════════════════════════════
// SIBLING CONNECTION (Horizontal dashed)
// ═══════════════════════════════════════════════════════════

interface SiblingConnectionProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isHighlighted: boolean;
  index: number;
}

const SiblingConnection = memo(function SiblingConnection({
  x1,
  y1,
  x2,
  y2,
  isHighlighted,
  index,
}: SiblingConnectionProps) {
  const dashOffset = useSharedValue(0);
  
  useEffect(() => {
    if (isHighlighted) {
      dashOffset.value = withRepeat(
        withTiming(-12, { duration: 800, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      dashOffset.value = 0;
    }
  }, [isHighlighted]);
  
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));
  
  const colors = CONNECTION_COLORS.sibling;
  const lineColor = isHighlighted ? colors.highlighted : colors.normal;
  
  return (
    <G>
      {isHighlighted && (
        <Line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.glow}
          strokeWidth={6}
          strokeLinecap="round"
        />
      )}
      <AnimatedLine
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={lineColor}
        strokeWidth={isHighlighted ? 3 : 2}
        strokeDasharray="6,4"
        strokeLinecap="round"
        animatedProps={animatedProps}
      />
    </G>
  );
});

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export const AnimatedConnectionLines = memo(function AnimatedConnectionLines({
  connectors,
  highlightedPath,
  offsetX,
  offsetY,
  width,
  height,
}: AnimatedConnectionLinesProps) {
  if (connectors.length === 0) return null;
  
  // Group parent-child connectors by parent for bracket rendering
  const parentChildGroups = new Map<string, Connector[]>();
  const otherConnectors: Connector[] = [];
  
  connectors.forEach(conn => {
    if (conn.type === 'parent-child') {
      const key = `${conn.from.x}-${conn.from.y}`;
      if (!parentChildGroups.has(key)) {
        parentChildGroups.set(key, []);
      }
      parentChildGroups.get(key)!.push(conn);
    } else {
      otherConnectors.push(conn);
    }
  });
  
  // Check if connection is in highlighted path
  const isConnectorHighlighted = (conn: Connector) => {
    if (highlightedPath.length < 2) return false;
    
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      if (
        (conn.from.id === highlightedPath[i] && conn.to.id === highlightedPath[i + 1]) ||
        (conn.to.id === highlightedPath[i] && conn.from.id === highlightedPath[i + 1])
      ) {
        return true;
      }
    }
    return false;
  };
  
  return (
    <Svg
      width={width}
      height={height}
      style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
    >
      <Defs>
        {/* Gradient definitions for various connection types */}
        <LinearGradient id="parentChildGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#6366F1" />
          <Stop offset="100%" stopColor="#4F46E5" />
        </LinearGradient>
        <LinearGradient id="spouseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#EC4899" />
          <Stop offset="100%" stopColor="#DB2777" />
        </LinearGradient>
      </Defs>
      
      {/* Spouse & Sibling connectors */}
      {otherConnectors.map((conn, index) => {
        const fromX = conn.from.x + offsetX;
        const fromY = conn.from.y + offsetY;
        const toX = conn.to.x + offsetX;
        const toY = conn.to.y + offsetY;
        const isHighlighted = isConnectorHighlighted(conn);
        
        if (conn.type === 'spouse') {
          return (
            <SpouseConnection
              key={`spouse-${index}-${conn.from.id}-${conn.to.id}`}
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              isHighlighted={isHighlighted}
              index={index}
            />
          );
        }
        
        if (conn.type === 'sibling') {
          return (
            <SiblingConnection
              key={`sibling-${index}-${conn.from.id}-${conn.to.id}`}
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              isHighlighted={isHighlighted}
              index={index}
            />
          );
        }
        
        return null;
      })}
      
      {/* Parent-Child bracket connectors */}
      {Array.from(parentChildGroups.entries()).map(([key, group], groupIndex) => {
        if (group.length === 0) return null;
        
        const parentX = group[0].from.x + offsetX;
        const parentY = group[0].from.y + offsetY;
        
        const childPositions = group.map(conn => ({
          x: conn.to.x + offsetX,
          y: conn.to.y + offsetY,
          id: conn.to.id,
        }));
        
        // Sort by X position
        childPositions.sort((a, b) => a.x - b.x);
        
        const isHighlighted = group.some(conn => isConnectorHighlighted(conn));
        
        return (
          <BracketConnection
            key={`bracket-${groupIndex}-${key}`}
            parentX={parentX}
            parentY={parentY}
            children={childPositions}
            isHighlighted={isHighlighted}
            index={groupIndex}
          />
        );
      })}
    </Svg>
  );
});

export default AnimatedConnectionLines;
