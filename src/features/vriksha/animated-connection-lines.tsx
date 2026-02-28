/**
 * ANIMATED CONNECTION LINES - Clean Visual Connections
 * 
 * Features:
 * - Smooth animated dash for highlighted paths
 * - Bracket-style parent-child connectors
 * - Heart symbol for spouse connections
 * - Clean, minimal line styles
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

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface AnimatedConnectionLinesProps {
  connectors: Connector[];
  highlightedPath: string[];
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

const CONNECTION_COLORS = {
  'parent-child': {
    normal: '#818CF8',
    highlighted: '#6366F1',
    glow: 'rgba(99, 102, 241, 0.25)',
  },
  spouse: {
    normal: '#F9A8D4',
    highlighted: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.25)',
  },
  sibling: {
    normal: '#6EE7B7',
    highlighted: '#10B981',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
};

// ── Spouse Connection ──

interface SpouseConnectionProps {
  x1: number; y1: number; x2: number; y2: number;
  isHighlighted: boolean; index: number;
}

const SpouseConnection = memo(function SpouseConnection({
  x1, y1, x2, y2, isHighlighted,
}: SpouseConnectionProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  const dashOffset = useSharedValue(0);
  
  useEffect(() => {
    if (isHighlighted) {
      dashOffset.value = withRepeat(
        withTiming(-20, { duration: 1000, easing: Easing.linear }),
        -1, false
      );
    } else {
      dashOffset.value = 0;
    }
  }, [isHighlighted]);
  
  const lineAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));
  
  const colors = CONNECTION_COLORS.spouse;
  const lineColor = isHighlighted ? colors.highlighted : colors.normal;
  
  return (
    <G>
      {isHighlighted && (
        <Line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={colors.glow} strokeWidth={6} strokeLinecap="round" />
      )}
      <AnimatedLine x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={lineColor}
        strokeWidth={isHighlighted ? 3 : 2}
        strokeLinecap="round"
        strokeDasharray={isHighlighted ? '10,5' : undefined}
        animatedProps={lineAnimatedProps}
      />
      <Circle cx={midX} cy={midY} r={10} fill="#FFF"
        stroke={lineColor} strokeWidth={1.5} />
      <SvgText x={midX} y={midY + 4} fontSize={10}
        textAnchor="middle" fill={lineColor}>
        ❤️
      </SvgText>
    </G>
  );
});

// ── Bracket Connection (Parent → Children) ──

interface BracketConnectionProps {
  parentX: number; parentY: number;
  children: Array<{ x: number; y: number; id: string }>;
  isHighlighted: boolean; index: number;
}

const BracketConnection = memo(function BracketConnection({
  parentX, parentY, children, isHighlighted,
}: BracketConnectionProps) {
  if (children.length === 0) return null;
  
  const dashOffset = useSharedValue(0);
  
  useEffect(() => {
    if (isHighlighted) {
      dashOffset.value = withRepeat(
        withTiming(-20, { duration: 1000, easing: Easing.linear }),
        -1, false
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
  const strokeWidth = isHighlighted ? 2.5 : 1.5;
  
  const minChildX = Math.min(...children.map(c => c.x));
  const maxChildX = Math.max(...children.map(c => c.x));
  const childY = children[0].y;
  const midY = parentY + (childY - parentY) / 2;
  
  let pathData = `M ${parentX} ${parentY} L ${parentX} ${midY}`;
  if (children.length > 1) {
    pathData += ` M ${minChildX} ${midY} L ${maxChildX} ${midY}`;
    pathData += ` M ${parentX} ${midY}`;
  }
  
  return (
    <G>
      {isHighlighted && (
        <Path d={pathData} stroke={colors.glow} strokeWidth={6}
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
      <AnimatedPath d={pathData} stroke={lineColor} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round" fill="none"
        strokeDasharray={isHighlighted ? '10,5' : undefined}
        animatedProps={animatedProps} />
      {children.map((child, i) => (
        <G key={`child-drop-${i}`}>
          {isHighlighted && (
            <Line x1={child.x} y1={midY} x2={child.x} y2={child.y}
              stroke={colors.glow} strokeWidth={6} strokeLinecap="round" />
          )}
          <Line x1={child.x} y1={midY} x2={child.x} y2={child.y}
            stroke={lineColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </G>
      ))}
    </G>
  );
});

// ── Sibling Connection ──

interface SiblingConnectionProps {
  x1: number; y1: number; x2: number; y2: number;
  isHighlighted: boolean; index: number;
}

const SiblingConnection = memo(function SiblingConnection({
  x1, y1, x2, y2, isHighlighted,
}: SiblingConnectionProps) {
  const dashOffset = useSharedValue(0);
  
  useEffect(() => {
    if (isHighlighted) {
      dashOffset.value = withRepeat(
        withTiming(-12, { duration: 800, easing: Easing.linear }),
        -1, false
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
        <Line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={colors.glow} strokeWidth={5} strokeLinecap="round" />
      )}
      <AnimatedLine x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={lineColor}
        strokeWidth={isHighlighted ? 2.5 : 1.5}
        strokeDasharray="5,4"
        strokeLinecap="round"
        animatedProps={animatedProps}
      />
    </G>
  );
});

// ── Main Component ──

export const AnimatedConnectionLines = memo(function AnimatedConnectionLines({
  connectors, highlightedPath, offsetX, offsetY, width, height,
}: AnimatedConnectionLinesProps) {
  if (connectors.length === 0) return null;
  
  const parentChildGroups = new Map<string, Connector[]>();
  const otherConnectors: Connector[] = [];
  
  connectors.forEach(conn => {
    if (conn.type === 'parent-child') {
      const key = `${conn.from.x}-${conn.from.y}`;
      if (!parentChildGroups.has(key)) parentChildGroups.set(key, []);
      parentChildGroups.get(key)!.push(conn);
    } else {
      otherConnectors.push(conn);
    }
  });
  
  const isConnectorHighlighted = (conn: Connector) => {
    if (highlightedPath.length < 2) return false;
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      if (
        (conn.from.id === highlightedPath[i] && conn.to.id === highlightedPath[i + 1]) ||
        (conn.to.id === highlightedPath[i] && conn.from.id === highlightedPath[i + 1])
      ) return true;
    }
    return false;
  };
  
  return (
    <Svg width={width} height={height}
      style={[StyleSheet.absoluteFill, { zIndex: -1 }]}>
      <Defs>
        <LinearGradient id="parentChildGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#818CF8" />
          <Stop offset="100%" stopColor="#6366F1" />
        </LinearGradient>
        <LinearGradient id="spouseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#F9A8D4" />
          <Stop offset="100%" stopColor="#EC4899" />
        </LinearGradient>
      </Defs>
      
      {otherConnectors.map((conn, index) => {
        const fromX = conn.from.x + offsetX;
        const fromY = conn.from.y + offsetY;
        const toX = conn.to.x + offsetX;
        const toY = conn.to.y + offsetY;
        const highlighted = isConnectorHighlighted(conn);
        
        if (conn.type === 'spouse') {
          return (
            <SpouseConnection key={`spouse-${index}-${conn.from.id}-${conn.to.id}`}
              x1={fromX} y1={fromY} x2={toX} y2={toY}
              isHighlighted={highlighted} index={index} />
          );
        }
        if (conn.type === 'sibling') {
          return (
            <SiblingConnection key={`sibling-${index}-${conn.from.id}-${conn.to.id}`}
              x1={fromX} y1={fromY} x2={toX} y2={toY}
              isHighlighted={highlighted} index={index} />
          );
        }
        return null;
      })}
      
      {Array.from(parentChildGroups.entries()).map(([key, group], groupIndex) => {
        if (group.length === 0) return null;
        const parentX = group[0].from.x + offsetX;
        const parentY = group[0].from.y + offsetY;
        const childPositions = group.map(conn => ({
          x: conn.to.x + offsetX,
          y: conn.to.y + offsetY,
          id: conn.to.id,
        }));
        childPositions.sort((a, b) => a.x - b.x);
        const highlighted = group.some(conn => isConnectorHighlighted(conn));
        
        return (
          <BracketConnection key={`bracket-${groupIndex}-${key}`}
            parentX={parentX} parentY={parentY}
            children={childPositions}
            isHighlighted={highlighted} index={groupIndex} />
        );
      })}
    </Svg>
  );
});

export default AnimatedConnectionLines;
