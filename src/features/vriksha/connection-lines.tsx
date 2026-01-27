/**
 * 🌳 CONNECTION LINES COMPONENT
 * ═══════════════════════════════════════════════════════════
 * 
 * SVG paths connecting family members in the tree visualization
 * Using ORTHOGONAL H-LAYOUT "Bracket" style connections.
 * 
 * VISUAL RULES:
 * ─────────────
 * ✓ SPOUSE: Horizontal line between spouses with heart symbol
 * ✓ PARENT-CHILD: Orthogonal bracket (down → across → down)
 *   - For couples: Drop from spouse line midpoint
 *   - For singles: Drop from node bottom center
 * ✓ SIBLING: Dotted horizontal line (optional)
 * 
 * BRACKET CONNECTOR LOGIC:
 * ────────────────────────
 * Parent(s) ───❤️─── Spouse
 *         │
 *    ─────┴─────      ← Horizontal bar at midY
 *    │    │    │
 *   Child1 Child2 Child3
 */

import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import type { Connector } from './types';

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════

interface ConnectionLinesProps {
  connectors: Connector[];
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export const ConnectionLines = memo(function ConnectionLines({
  connectors,
  offsetX,
  offsetY,
  width,
  height,
}: ConnectionLinesProps) {
  if (connectors.length === 0) return null;
  
  // Group parent-child connectors by parent to draw shared horizontal bars
  const parentChildGroups = new Map<string, Connector[]>();
  const otherConnectors: Connector[] = [];
  
  connectors.forEach(conn => {
    if (conn.type === 'parent-child') {
      // Group by the "from" position (parent drop point)
      const key = `${conn.from.x}-${conn.from.y}`;
      if (!parentChildGroups.has(key)) {
        parentChildGroups.set(key, []);
      }
      parentChildGroups.get(key)!.push(conn);
    } else {
      otherConnectors.push(conn);
    }
  });
  
  return (
    <Svg
      width={width}
      height={height}
      style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
    >
      {/* ═══════════ SPOUSE & SIBLING CONNECTORS ═══════════ */}
      {otherConnectors.map((conn, index) => {
        const fromX = conn.from.x + offsetX;
        const fromY = conn.from.y + offsetY;
        const toX = conn.to.x + offsetX;
        const toY = conn.to.y + offsetY;
        
        if (conn.type === 'spouse') {
          return (
            <SpouseConnection
              key={`spouse-${index}-${conn.from.id}-${conn.to.id}`}
              fromX={fromX}
              fromY={fromY}
              toX={toX}
              toY={toY}
              color={conn.color}
              isDashed={conn.style === 'dashed'}
            />
          );
        }
        
        if (conn.type === 'sibling') {
          return (
            <Line
              key={`sibling-${index}-${conn.from.id}-${conn.to.id}`}
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke={conn.color}
              strokeWidth={2}
              strokeDasharray="4,4"
            />
          );
        }
        
        return null;
      })}
      
      {/* ═══════════ PARENT-CHILD BRACKET CONNECTORS ═══════════ */}
      {Array.from(parentChildGroups.entries()).map(([key, group], groupIndex) => {
        if (group.length === 0) return null;
        
        const parentX = group[0].from.x + offsetX;
        const parentY = group[0].from.y + offsetY;
        const color = group[0].color;
        const isDashed = group[0].style === 'dashed';
        
        // Get all children positions
        const childPositions = group.map(conn => ({
          x: conn.to.x + offsetX,
          y: conn.to.y + offsetY,
          id: conn.to.id,
        }));
        
        // Sort by X position
        childPositions.sort((a, b) => a.x - b.x);
        
        return (
          <BracketConnection
            key={`bracket-${groupIndex}-${key}`}
            parentX={parentX}
            parentY={parentY}
            children={childPositions}
            color={color}
            isDashed={isDashed}
          />
        );
      })}
    </Svg>
  );
});

// ═══════════════════════════════════════════════════════════
// SPOUSE CONNECTION (Horizontal with heart)
// ═══════════════════════════════════════════════════════════

interface SpouseConnectionProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  isDashed: boolean;
}

function SpouseConnection({ fromX, fromY, toX, toY, color, isDashed }: SpouseConnectionProps) {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  
  return (
    <G>
      {/* Main horizontal line */}
      <Line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={color}
        strokeWidth={3}
        strokeDasharray={isDashed ? '5,5' : undefined}
      />
      
      {/* Heart circle background */}
      <Circle
        cx={midX}
        cy={midY}
        r={10}
        fill="#FFF"
        stroke={color}
        strokeWidth={1.5}
      />
      
      {/* Heart emoji in center */}
      <SvgText
        x={midX}
        y={midY + 4}
        fontSize={10}
        textAnchor="middle"
        fill={color}
      >
        ❤️
      </SvgText>
    </G>
  );
}

// ═══════════════════════════════════════════════════════════
// BRACKET CONNECTION (Orthogonal H-Layout)
// ═══════════════════════════════════════════════════════════
// 
// Visual Structure:
//        Parent
//          │   ← Vertical drop from parent
//    ──────┴──────  ← Horizontal bar
//    │     │     │  ← Vertical drops to children
//  Child1 Child2 Child3
//
// ═══════════════════════════════════════════════════════════

interface BracketConnectionProps {
  parentX: number;
  parentY: number;
  children: { x: number; y: number; id: string }[];
  color: string;
  isDashed: boolean;
}

function BracketConnection({ 
  parentX, 
  parentY, 
  children, 
  color, 
  isDashed 
}: BracketConnectionProps) {
  if (children.length === 0) return null;
  
  // Calculate the horizontal bar Y position (midway between parent and children)
  const childY = children[0].y;
  const midY = parentY + (childY - parentY) * 0.4; // 40% of the way down
  
  // Get the leftmost and rightmost child X positions
  const leftmostX = Math.min(...children.map(c => c.x));
  const rightmostX = Math.max(...children.map(c => c.x));
  
  const strokeProps = {
    stroke: color,
    strokeWidth: 2.5,
    strokeDasharray: isDashed ? '6,4' : undefined,
    fill: 'none',
  };
  
  // Build the path
  // 1. Vertical line from parent down to horizontal bar
  // 2. Horizontal bar spanning all children
  // 3. Vertical lines from horizontal bar down to each child
  
  return (
    <G>
      {/* 1. Vertical drop from parent to horizontal bar */}
      <Line
        x1={parentX}
        y1={parentY}
        x2={parentX}
        y2={midY}
        {...strokeProps}
      />
      
      {/* 2. Horizontal bar across all children */}
      {children.length > 1 ? (
        <Line
          x1={leftmostX}
          y1={midY}
          x2={rightmostX}
          y2={midY}
          {...strokeProps}
        />
      ) : null}
      
      {/* 3. Connection from parent drop point to horizontal bar */}
      {/* (only if parent is not directly above one child) */}
      {children.length > 1 && (parentX < leftmostX || parentX > rightmostX) ? (
        <Line
          x1={parentX}
          y1={midY}
          x2={parentX < leftmostX ? leftmostX : rightmostX}
          y2={midY}
          {...strokeProps}
        />
      ) : null}
      
      {/* 4. Vertical drops to each child */}
      {children.map((child, index) => (
        <G key={`child-drop-${child.id}-${index}`}>
          <Line
            x1={child.x}
            y1={midY}
            x2={child.x}
            y2={child.y}
            {...strokeProps}
          />
          {/* Small circle at child connection point */}
          <Circle
            cx={child.x}
            cy={child.y - 2}
            r={4}
            fill={color}
          />
        </G>
      ))}
      
      {/* Junction circle at horizontal bar level */}
      {children.length === 1 && (
        <Circle
          cx={parentX}
          cy={midY}
          r={3}
          fill={color}
        />
      )}
    </G>
  );
}
