/**
 * 🌳 ENHANCED FAMILY TREE - Stunning Visualization
 * ═══════════════════════════════════════════════════════════
 * 
 * A beautiful, animated family tree visualization:
 * ✓ Smooth gesture-based pan and zoom
 * ✓ Animated node selection with pulse effects
 * ✓ Glowing connection lines for highlighted paths
 * ✓ Dynamic relationship labels
 * ✓ Auto-fit and center on load
 * ✓ Quick-add member flow
 * 
 * PHILOSOPHY: "A family tree is a living garden of souls"
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VanshColors, VanshSpacing } from '../../theme';
import { AnimatedConnectionLines } from './animated-connection-lines';
import { AnimatedMemberNode } from './animated-member-node';
import { QuickAddMember } from './quick-add-member';
import { calculateTreeLayout, membersToFamilyNodes } from './tree-layout';
import type { LayoutNode, TreeLayout } from './types';
import { generateDemoFamily, useVrikshaStore, type FamilyMember } from './vriksha-store';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const INITIAL_SCALE = 0.5;

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface EnhancedFamilyTreeProps {
  onMemberPress?: (member: FamilyMember) => void;
  onMemberLongPress?: (member: FamilyMember) => void;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export function EnhancedFamilyTree({
  onMemberPress,
  onMemberLongPress,
}: EnhancedFamilyTreeProps) {
  const insets = useSafeAreaInsets();
  
  // Store
  const {
    members,
    rootMemberId,
    membersWithRelationships,
    highlightedPath,
    setSelectedMember,
    setHighlightedPath,
    findRelationship,
    importData,
  } = useVrikshaStore();
  
  // Local state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingToMember, setAddingToMember] = useState<FamilyMember | undefined>();
  const [relationshipLabel, setRelationshipLabel] = useState<string | null>(null);
  
  // Two-member selection: tap first member, then tap second to see relationship
  const [firstSelectedId, setFirstSelectedId] = useState<string | null>(null);
  const [secondSelectedId, setSecondSelectedId] = useState<string | null>(null);
  
  // Gesture values
  const scale = useSharedValue(INITIAL_SCALE);
  const savedScale = useSharedValue(INITIAL_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  
  // Store the computed center position for resets
  const centerTargetX = useSharedValue(0);
  const centerTargetY = useSharedValue(0);
  
  // Canvas dimensions as shared values for transform origin compensation
  const canvasWSV = useSharedValue(0);
  const canvasHSV = useSharedValue(0);
  
  // Convert members to tree layout
  const treeLayout = useMemo<TreeLayout>(() => {
    const membersList = Array.from(members.values());
    
    if (membersList.length === 0) {
      return { nodes: [], connectors: [], bounds: { width: 0, height: 0, minX: 0, minY: 0 } };
    }
    
    // Build relationships array from store
    const relArray = membersWithRelationships.flatMap(m =>
      (m.relationships || []).map(r => ({
        fromId: m.id,
        toId: r.memberId as string,
        type: r.type,
      }))
    );
    
    // Convert to tree nodes
    const { nodes, personData } = membersToFamilyNodes(membersWithRelationships, relArray);
    
    const rootId = rootMemberId || membersList[0]?.id;
    if (!rootId) {
      return { nodes: [], connectors: [], bounds: { width: 0, height: 0, minX: 0, minY: 0 } };
    }
    
    return calculateTreeLayout(nodes, personData, rootId);
  }, [members, rootMemberId, membersWithRelationships]);
  
  // Canvas dimensions
  const canvasWidth = Math.max(SCREEN_WIDTH * 2, treeLayout.bounds.width + 400);
  const canvasHeight = Math.max(SCREEN_HEIGHT * 2, treeLayout.bounds.height + 400);
  const offsetX = 100 - treeLayout.bounds.minX;
  const offsetY = 100 - treeLayout.bounds.minY;
  
  // Sync canvas dimensions to shared values for animated style
  useEffect(() => {
    canvasWSV.value = canvasWidth;
    canvasHSV.value = canvasHeight;
  }, [canvasWidth, canvasHeight]);
  
  // Compute best-fit scale based on tree bounds
  const computeFitScale = useCallback(() => {
    if (treeLayout.bounds.width === 0 || treeLayout.bounds.height === 0) return INITIAL_SCALE;
    const padX = 160; // padding on each side
    const padY = 200; // header + bottom padding
    const availW = SCREEN_WIDTH - padX;
    const availH = SCREEN_HEIGHT - padY;
    const fitW = availW / (treeLayout.bounds.width + 200);
    const fitH = availH / (treeLayout.bounds.height + 200);
    const fit = Math.min(fitW, fitH);
    return Math.max(MIN_SCALE, Math.min(fit, 1.0)); // clamp between MIN_SCALE and 1.0
  }, [treeLayout.bounds]);
  
  // Center tree on mount or when root changes
  useEffect(() => {
    if (treeLayout.nodes.length > 0) {
      const fitScale = computeFitScale();
      const centerX = (treeLayout.bounds.width / 2) + offsetX;
      const centerY = (treeLayout.bounds.height / 2) + offsetY;
      
      const targetX = SCREEN_WIDTH / 2 - centerX * fitScale;
      const targetY = SCREEN_HEIGHT / 3 - centerY * fitScale;
      
      // Save these for reset button
      centerTargetX.value = targetX;
      centerTargetY.value = targetY;
      
      translateX.value = withTiming(targetX, { duration: 400 });
      translateY.value = withTiming(targetY, { duration: 400 });
      scale.value = withTiming(fitScale, { duration: 400 });
      savedScale.value = fitScale;
    }
  }, [treeLayout.nodes.length, rootMemberId]);
  
  // Handle node press — two-member selection model
  // Single tap = select for relationship finding
  // Tap already-selected member = open detail sheet
  // Long press = quick-add relative
  const handleNodePress = useCallback((node: LayoutNode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const memberId = node.id;
    const member = members.get(memberId);
    
    if (firstSelectedId === memberId && !secondSelectedId) {
      // Tapping already-selected first member → open detail sheet
      if (member && onMemberPress) {
        onMemberPress(member);
      }
      // Clear selection
      setFirstSelectedId(null);
      setSelectedMember(null);
      setHighlightedPath([]);
      setRelationshipLabel(null);
    } else if (secondSelectedId === memberId) {
      // Tapping already-selected second member → open detail sheet
      if (member && onMemberPress) {
        onMemberPress(member);
      }
      // Clear all selection
      setFirstSelectedId(null);
      setSecondSelectedId(null);
      setSelectedMember(null);
      setHighlightedPath([]);
      setRelationshipLabel(null);
    } else if (firstSelectedId === memberId && secondSelectedId) {
      // Tapping first member while second is also selected → open detail sheet
      if (member && onMemberPress) {
        onMemberPress(member);
      }
      setFirstSelectedId(null);
      setSecondSelectedId(null);
      setSelectedMember(null);
      setHighlightedPath([]);
      setRelationshipLabel(null);
    } else if (!firstSelectedId) {
      // First selection — just highlight, don't open sheet
      setFirstSelectedId(memberId);
      setSecondSelectedId(null);
      setSelectedMember(memberId);
      setHighlightedPath([]);
      setRelationshipLabel(null);
    } else {
      // Second selection — find relationship between first and second
      setSecondSelectedId(memberId);
      setSelectedMember(memberId);
      
      const result = findRelationship(firstSelectedId, memberId);
      if (result) {
        setHighlightedPath(result.path);
        setRelationshipLabel(result.label);
      } else {
        setHighlightedPath([]);
        setRelationshipLabel('No direct relation found');
      }
    }
  }, [firstSelectedId, secondSelectedId, members, findRelationship, onMemberPress]);
  
  // Handle node long press - opens quick-add relative modal
  const handleNodeLongPress = useCallback((node: LayoutNode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const member = members.get(node.id);
    if (member) {
      setAddingToMember(member);
      setShowAddModal(true);
    }
  }, [members]);
  
  // Handle add member
  const handleAddMember = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If we have a selected member, add relative to them
    const activeSelection = secondSelectedId || firstSelectedId;
    if (activeSelection) {
      const member = members.get(activeSelection);
      setAddingToMember(member);
    } else if (rootMemberId) {
      const member = members.get(rootMemberId);
      setAddingToMember(member);
    } else {
      setAddingToMember(undefined);
    }
    
    setShowAddModal(true);
  }, [firstSelectedId, secondSelectedId, rootMemberId, members]);
  
  // Load demo data
  const handleLoadDemo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { members: demoMembers, relations: demoRelations } = generateDemoFamily();
    importData(demoMembers, demoRelations);
  }, [importData]);
  
  // ═══════════ GESTURES ═══════════
  
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });
  
  const panGesture = Gesture.Pan()
    .minDistance(5)
    .minPointers(1)
    .maxPointers(2)
    .activeOffsetX([-8, 8])
    .activeOffsetY([-8, 8])
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    });
  
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      const fitScale = savedScale.value < 0.4 ? 0.7 : INITIAL_SCALE;
      scale.value = withTiming(fitScale, { duration: 300 });
      translateX.value = withTiming(centerTargetX.value, { duration: 300 });
      translateY.value = withTiming(centerTargetY.value, { duration: 300 });
    });
  
  const composed = Gesture.Simultaneous(pinchGesture, panGesture);
  const withDoubleTap = Gesture.Exclusive(doubleTapGesture, composed);
  
  // Animated canvas style
  // Compensate for React Native's center-based transform origin.
  // Without this, the large canvas shifts by canvasW/2*(1-scale) pixels.
  const canvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + canvasWSV.value * 0.5 * (scale.value - 1) },
      { translateY: translateY.value + canvasHSV.value * 0.5 * (scale.value - 1) },
      { scale: scale.value },
    ],
  }));
  
  // ═══════════ EMPTY STATE ═══════════
  
  if (members.size === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <Animated.View 
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.emptyContent}
        >
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>🌱</Text>
          </View>
          
          <Text style={styles.emptyTitle}>Start Your Family Tree</Text>
          <Text style={styles.emptyDescription}>
            Plant the first seed of your family heritage.{'\n'}
            Add yourself or a family member to begin.
          </Text>
          
          <View style={styles.emptyActions}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleAddMember}
            >
              <MaterialIcons name="person-add" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Add First Member</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleLoadDemo}
            >
              <MaterialIcons name="family-restroom" size={20} color={VanshColors.suvarna[600]} />
              <Text style={styles.secondaryButtonText}>Load Demo Family</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        <QuickAddMember
          visible={showAddModal}
          baseMember={addingToMember}
          onClose={() => setShowAddModal(false)}
        />
      </View>
    );
  }
  
  // ═══════════ MAIN RENDER ═══════════
  
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ═══════════ FLOATING CONTROLS ═══════════ */}
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={[styles.controls, { top: insets.top + VanshSpacing.md }]}
      >
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            scale.value = withTiming(Math.min(scale.value * 1.4, MAX_SCALE), { duration: 200 });
          }}
        >
          <MaterialIcons name="zoom-in" size={24} color={VanshColors.masi[700]} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            scale.value = withTiming(Math.max(scale.value * 0.7, MIN_SCALE), { duration: 200 });
          }}
        >
          <MaterialIcons name="zoom-out" size={24} color={VanshColors.masi[700]} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Recalculate fit scale and center
            const fitScale = computeFitScale();
            const centerX = (treeLayout.bounds.width / 2) + offsetX;
            const centerY = (treeLayout.bounds.height / 2) + offsetY;
            const targetX = SCREEN_WIDTH / 2 - centerX * fitScale;
            const targetY = SCREEN_HEIGHT / 3 - centerY * fitScale;
            centerTargetX.value = targetX;
            centerTargetY.value = targetY;
            scale.value = withTiming(fitScale, { duration: 300 });
            translateX.value = withTiming(targetX, { duration: 300 });
            translateY.value = withTiming(targetY, { duration: 300 });
          }}
        >
          <MaterialIcons name="center-focus-strong" size={24} color={VanshColors.masi[700]} />
        </TouchableOpacity>
      </Animated.View>
      
      {/* ═══════════ ADD MEMBER FAB ═══════════ */}
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={[styles.fab, { bottom: insets.bottom + VanshSpacing.lg }]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleAddMember}
        >
          <MaterialIcons name="person-add" size={28} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* ═══════════ LEGEND ═══════════ */}
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={[styles.legend, { top: insets.top + VanshSpacing.md }]}
      >
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Male</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EC4899' }]} />
          <Text style={styles.legendText}>Female</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
          <Text style={styles.legendText}>Deceased</Text>
        </View>
        <View style={styles.legendDivider} />
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#EC4899' }]} />
          <Text style={styles.legendText}>Married</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#6366F1' }]} />
          <Text style={styles.legendText}>Parent-Child</Text>
        </View>
      </Animated.View>
      
      {/* ═══════════ RELATIONSHIP BADGE ═══════════ */}
      {firstSelectedId && secondSelectedId && relationshipLabel && (() => {
        const firstMember = members.get(firstSelectedId);
        const secondMember = members.get(secondSelectedId);
        const firstName = firstMember?.firstName || '?';
        const secondName = secondMember?.firstName || '?';
        return (
          <Animated.View 
            entering={FadeIn.duration(250)}
            style={[styles.relationshipBadge, { top: insets.top + VanshSpacing.md }]}
          >
            <View style={styles.relationshipBadgeHeader}>
              <Text style={styles.relationshipBadgeLabel}>
                {firstName} → {secondName}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFirstSelectedId(null);
                  setSecondSelectedId(null);
                  setSelectedMember(null);
                  setHighlightedPath([]);
                  setRelationshipLabel(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={16} color={VanshColors.masi[400]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.relationshipBadgeText}>{relationshipLabel}</Text>
          </Animated.View>
        );
      })()}
      
      {/* ═══════════ TREE CANVAS ═══════════ */}
      <GestureDetector gesture={withDoubleTap}>
        <Animated.View
          style={[styles.canvas, canvasStyle, { width: canvasWidth, height: canvasHeight }]}
        >
          {/* Connection Lines */}
          <AnimatedConnectionLines
            connectors={treeLayout.connectors}
            highlightedPath={highlightedPath}
            offsetX={offsetX}
            offsetY={offsetY}
            width={canvasWidth}
            height={canvasHeight}
          />
          
          {/* Member Nodes */}
          {treeLayout.nodes.map((node) => {
            const isRoot = node.id === rootMemberId;
            const isSelected = node.id === firstSelectedId || node.id === secondSelectedId;
            const isHighlighted = highlightedPath.includes(node.id);
            
            return (
              <View
                key={node.id}
                style={[
                  styles.nodeWrapper,
                  {
                    left: node.x + offsetX,
                    top: node.y + offsetY,
                  },
                ]}
              >
                <AnimatedMemberNode
                  node={node}
                  isRoot={isRoot}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  relationLabel={node.id === secondSelectedId && relationshipLabel ? relationshipLabel : undefined}
                  onPress={handleNodePress}
                  onLongPress={handleNodeLongPress}
                />
              </View>
            );
          })}
        </Animated.View>
      </GestureDetector>
      
      {/* ═══════════ INSTRUCTIONS ═══════════ */}
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={[styles.instructions, { bottom: insets.bottom + 80 }]}
      >
        <Text style={styles.instructionsText}>
          {'Tap two members to see relationship • Tap again to view profile • Long press to add relative'}
        </Text>
      </Animated.View>
      
      {/* ═══════════ ADD MEMBER MODAL ═══════════ */}
      <QuickAddMember
        visible={showAddModal}
        baseMember={addingToMember}
        onClose={() => {
          setShowAddModal(false);
          setAddingToMember(undefined);
        }}
      />
    </GestureHandlerRootView>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  
  canvas: {
    position: 'relative',
    overflow: 'visible',
  },
  
  nodeWrapper: {
    position: 'absolute',
  },
  
  // Controls
  controls: {
    position: 'absolute',
    right: VanshSpacing.md,
    zIndex: 100,
    gap: VanshSpacing.xs,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: VanshSpacing.xs,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: VanshSpacing.lg,
    zIndex: 100,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: VanshColors.suvarna[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: VanshColors.suvarna[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Legend
  legend: {
    position: 'absolute',
    left: VanshSpacing.md,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: VanshSpacing.sm,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  legendDivider: {
    height: 1,
    backgroundColor: VanshColors.khadi[200],
    marginVertical: 4,
  },
  legendText: {
    fontSize: 11,
    color: VanshColors.masi[600],
  },
  
  // Relationship Badge
  relationshipBadge: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -110 }],
    width: 220,
    zIndex: 100,
    backgroundColor: VanshColors.suvarna[100],
    borderRadius: 16,
    padding: VanshSpacing.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: VanshColors.suvarna[400],
  },
  relationshipBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  relationshipBadgeLabel: {
    fontSize: 10,
    color: VanshColors.masi[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  relationshipBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.suvarna[700],
    textAlign: 'center',
    width: '100%',
  },
  
  // Instructions
  instructions: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  instructionsText: {
    fontSize: 12,
    color: VanshColors.masi[400],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.xs,
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: VanshSpacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: VanshColors.suvarna[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: VanshSpacing.lg,
    
    shadowColor: VanshColors.suvarna[400],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyIcon: {
    fontSize: 70,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: VanshSpacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: VanshColors.masi[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: VanshSpacing.xl,
  },
  emptyActions: {
    gap: VanshSpacing.md,
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.suvarna[500],
    paddingVertical: VanshSpacing.md,
    paddingHorizontal: VanshSpacing.xl,
    borderRadius: 30,
    gap: VanshSpacing.sm,
    
    shadowColor: VanshColors.suvarna[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.suvarna[50],
    paddingVertical: VanshSpacing.md,
    paddingHorizontal: VanshSpacing.xl,
    borderRadius: 30,
    gap: VanshSpacing.sm,
    borderWidth: 2,
    borderColor: VanshColors.suvarna[300],
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: VanshColors.suvarna[700],
  },
});

export default EnhancedFamilyTree;
