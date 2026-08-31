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
import { VanshColors } from '../../theme';
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
    normal: VanshColors.neelam[400],
    highlighted: VanshColors.suvarna[500],
    glow: 'rgba(212, 175, 55, 0.25)',
  },
  spouse: {
    normal: VanshColors.padma[300],
    highlighted: VanshColors.sindoor[500],
    glow: 'rgba(224, 69, 69, 0.2)',
  },
  sibling: {
    normal: VanshColors.chandan[400],
    highlighted: VanshColors.suvarna[500],
    glow: 'rgba(212, 175, 55, 0.2)',
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
  childPositions: { x: number; y: number; id: string }[];
  isHighlighted: boolean; index: number;
}

const BracketConnection = memo(function BracketConnection({
  parentX, parentY, childPositions, isHighlighted,
}: BracketConnectionProps) {
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

  if (childPositions.length === 0) return null;

  const colors = CONNECTION_COLORS['parent-child'];
  const lineColor = isHighlighted ? colors.highlighted : colors.normal;
  const strokeWidth = isHighlighted ? 2.5 : 1.5;

  const minChildX = Math.min(...childPositions.map(c => c.x));
  const maxChildX = Math.max(...childPositions.map(c => c.x));
  const childY = childPositions[0].y;
  const midY = parentY + (childY - parentY) / 2;

  let pathData = `M ${parentX} ${parentY} L ${parentX} ${midY}`;
  if (childPositions.length > 1) {
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
      {childPositions.map((child, i) => (
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
          <Stop offset="0%" stopColor={VanshColors.neelam[400]} />
          <Stop offset="100%" stopColor={VanshColors.neelam[600]} />
        </LinearGradient>
        <LinearGradient id="spouseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={VanshColors.padma[300]} />
          <Stop offset="100%" stopColor={VanshColors.sindoor[500]} />
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
            childPositions={childPositions}
            isHighlighted={highlighted} index={groupIndex} />
        );
      })}
    </Svg>
  );
});

export default AnimatedConnectionLines;
