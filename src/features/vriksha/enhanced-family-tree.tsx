/**
 * ENHANCED FAMILY TREE - Smooth & Modern Visualization
 * 
 * Features:
 * - Fluid gesture-based pan and zoom (improved responsiveness)
 * - Clean, minimal UI overlays
 * - Animated node selection with relationship finding
 * - Quick-add member flow
 * - Auto-fit and center on load
 * - Momentum-based scrolling feel
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VanshColors } from '../../theme';
import { AnimatedConnectionLines } from './animated-connection-lines';
import { AnimatedMemberNode } from './animated-member-node';
import { QuickAddMember } from './quick-add-member';
import { calculateTreeLayout, membersToFamilyNodes } from './tree-layout';
import type { LayoutNode, TreeLayout } from './types';
import { generateDemoFamily, useVrikshaStore, type FamilyMember } from './vriksha-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MIN_SCALE = 0.08;
const MAX_SCALE = 2.5;
const INITIAL_SCALE = 1.0;

export interface EnhancedFamilyTreeProps {
  onMemberPress?: (member: FamilyMember) => void;
  onMemberLongPress?: (member: FamilyMember) => void;
}

export function EnhancedFamilyTree({
  onMemberPress,
  onMemberLongPress,
}: EnhancedFamilyTreeProps) {
  const insets = useSafeAreaInsets();
  
  const {
    members,
    rootMemberId,
    membersWithRelationships,
    highlightedPath,
    setSelectedMember,
    setHighlightedPath,
    setRootMember,
    findRelationship,
    importData,
  } = useVrikshaStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingToMember, setAddingToMember] = useState<FamilyMember | undefined>();
  const [relationshipLabel, setRelationshipLabel] = useState<string | null>(null);
  const [firstSelectedId, setFirstSelectedId] = useState<string | null>(null);
  const [secondSelectedId, setSecondSelectedId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showViewAsPicker, setShowViewAsPicker] = useState(false);
  const [viewAsSearch, setViewAsSearch] = useState('');
  
  // View As — computed
  const allMembersList = useMemo(() => Array.from(members.values()), [members]);
  const currentRootMember = rootMemberId ? members.get(rootMemberId) : allMembersList[0] || null;
  const filteredViewAsMembers = useMemo(() => {
    if (!viewAsSearch.trim()) return allMembersList;
    const q = viewAsSearch.toLowerCase();
    return allMembersList.filter(m =>
      m.firstName.toLowerCase().includes(q) ||
      (m.lastName || '').toLowerCase().includes(q)
    );
  }, [allMembersList, viewAsSearch]);
  
  const handleViewAs = useCallback((memberId: string) => {
    setRootMember(memberId);
    setShowViewAsPicker(false);
    setViewAsSearch('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [setRootMember]);
  
  // Gesture values
  const scale = useSharedValue(INITIAL_SCALE);
  const savedScale = useSharedValue(INITIAL_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const centerTargetX = useSharedValue(0);
  const centerTargetY = useSharedValue(0);
  const canvasWSV = useSharedValue(0);
  const canvasHSV = useSharedValue(0);
  
  // Convert members to tree layout
  const treeLayout = useMemo<TreeLayout>(() => {
    const membersList = Array.from(members.values());
    if (membersList.length === 0) {
      return { nodes: [], connectors: [], bounds: { width: 0, height: 0, minX: 0, minY: 0 } };
    }
    
    const relArray = membersWithRelationships.flatMap(m =>
      (m.relationships || []).map(r => ({
        fromId: m.id,
        toId: r.memberId as string,
        type: r.type,
      }))
    );
    
    const { nodes, personData } = membersToFamilyNodes(membersWithRelationships, relArray);
    const rootId = rootMemberId || membersList[0]?.id;
    if (!rootId) {
      return { nodes: [], connectors: [], bounds: { width: 0, height: 0, minX: 0, minY: 0 } };
    }
    return calculateTreeLayout(nodes, personData, rootId);
  }, [members, rootMemberId, membersWithRelationships]);
  
  const canvasWidth = Math.max(SCREEN_WIDTH * 2, treeLayout.bounds.width + 400);
  const canvasHeight = Math.max(SCREEN_HEIGHT * 2, treeLayout.bounds.height + 400);
  const offsetX = 100 - treeLayout.bounds.minX;
  const offsetY = 100 - treeLayout.bounds.minY;
  
  useEffect(() => {
    canvasWSV.value = canvasWidth;
    canvasHSV.value = canvasHeight;
  }, [canvasWidth, canvasHeight]);
  
  const computeFitScale = useCallback(() => {
    if (treeLayout.bounds.width === 0 || treeLayout.bounds.height === 0) return INITIAL_SCALE;
    const padX = 120;
    const padY = 180;
    const availW = SCREEN_WIDTH - padX;
    const availH = SCREEN_HEIGHT - padY;
    const fitW = availW / (treeLayout.bounds.width + 200);
    const fitH = availH / (treeLayout.bounds.height + 200);
    const fit = Math.min(fitW, fitH);
    return Math.max(MIN_SCALE, Math.min(fit, 1.5));
  }, [treeLayout.bounds]);
  
  // Center tree on mount or when root changes
  useEffect(() => {
    if (treeLayout.nodes.length > 0) {
      const fitScale = computeFitScale();
      const centerX = (treeLayout.bounds.width / 2) + offsetX;
      const centerY = (treeLayout.bounds.height / 2) + offsetY;
      const targetX = SCREEN_WIDTH / 2 - centerX * fitScale;
      const targetY = SCREEN_HEIGHT / 3 - centerY * fitScale;
      
      centerTargetX.value = targetX;
      centerTargetY.value = targetY;
      
      translateX.value = withTiming(targetX, { duration: 380, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(targetY, { duration: 380, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(fitScale, { duration: 380, easing: Easing.out(Easing.cubic) });
      savedScale.value = fitScale;
      savedTranslateX.value = targetX;
      savedTranslateY.value = targetY;
    }
  }, [treeLayout.nodes.length, rootMemberId]);
  
  // Handle node press — two-member selection model
  const handleNodePress = useCallback((node: LayoutNode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const memberId = node.id;
    const member = members.get(memberId);
    
    if (firstSelectedId === memberId && !secondSelectedId) {
      if (member && onMemberPress) onMemberPress(member);
      setFirstSelectedId(null);
      setSelectedMember(null);
      setHighlightedPath([]);
      setRelationshipLabel(null);
    } else if (secondSelectedId === memberId) {
      if (member && onMemberPress) onMemberPress(member);
      setFirstSelectedId(null);
      setSecondSelectedId(null);
      setSelectedMember(null);
      setHighlightedPath([]);
      setRelationshipLabel(null);
    } else if (firstSelectedId === memberId && secondSelectedId) {
      if (member && onMemberPress) onMemberPress(member);
      setFirstSelectedId(null);
      setSecondSelectedId(null);
      setSelectedMember(null);
      setHighlightedPath([]);
      setRelationshipLabel(null);
    } else if (!firstSelectedId) {
      setFirstSelectedId(memberId);
      setSecondSelectedId(null);
      setSelectedMember(memberId);
      setHighlightedPath([]);
      setRelationshipLabel(null);
    } else {
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
  
  const handleNodeLongPress = useCallback((node: LayoutNode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const member = members.get(node.id);
    if (member) {
      setAddingToMember(member);
      setShowAddModal(true);
    }
  }, [members]);
  
  const handleAddMember = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const activeSelection = secondSelectedId || firstSelectedId;
    if (activeSelection) {
      setAddingToMember(members.get(activeSelection));
    } else if (rootMemberId) {
      setAddingToMember(members.get(rootMemberId));
    } else {
      setAddingToMember(undefined);
    }
    setShowAddModal(true);
  }, [firstSelectedId, secondSelectedId, rootMemberId, members]);
  
  const handleLoadDemo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { members: demoMembers, relations: demoRelations } = generateDemoFamily();
    importData(demoMembers, demoRelations);
  }, [importData]);
  
  const handleResetView = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const fitScale = computeFitScale();
    const centerX = (treeLayout.bounds.width / 2) + offsetX;
    const centerY = (treeLayout.bounds.height / 2) + offsetY;
    const targetX = SCREEN_WIDTH / 2 - centerX * fitScale;
    const targetY = SCREEN_HEIGHT / 3 - centerY * fitScale;
    centerTargetX.value = targetX;
    centerTargetY.value = targetY;
    scale.value = withTiming(fitScale, { duration: 380, easing: Easing.out(Easing.cubic) });
    translateX.value = withTiming(targetX, { duration: 380, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(targetY, { duration: 380, easing: Easing.out(Easing.cubic) });
    savedScale.value = fitScale;
    savedTranslateX.value = targetX;
    savedTranslateY.value = targetY;
  }, [computeFitScale, treeLayout, offsetX, offsetY]);
  
  // ─── GESTURES (improved smoothness) ───
  
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
    .minDistance(3)
    .minPointers(1)
    .maxPointers(2)
    .activeOffsetX([-5, 5])
    .activeOffsetY([-5, 5])
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd((e) => {
      // Smooth momentum decay — lower deceleration = longer glide, no bounce
      translateX.value = withDecay({
        velocity: e.velocityX,
        deceleration: 0.994,
        clamp: undefined,
      });
      translateY.value = withDecay({
        velocity: e.velocityY,
        deceleration: 0.994,
        clamp: undefined,
      });
    });
  
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleResetView)();
    });
  
  const composed = Gesture.Simultaneous(pinchGesture, panGesture);
  const withDoubleTap = Gesture.Exclusive(doubleTapGesture, composed);
  
  const canvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + canvasWSV.value * 0.5 * (scale.value - 1) },
      { translateY: translateY.value + canvasHSV.value * 0.5 * (scale.value - 1) },
      { scale: scale.value },
    ],
  }));
  
  // ─── EMPTY STATE ───
  
  if (members.size === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <Animated.View 
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.emptyContent}
        >
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="nature-people" size={56} color={VanshColors.suvarna[500]} />
          </View>
          
          <Text style={styles.emptyTitle}>Start Your Family Tree</Text>
          <Text style={styles.emptyDescription}>
            Add yourself or a family member to begin building your tree.
          </Text>
          
          <View style={styles.emptyActions}>
            <Pressable style={styles.primaryButton} onPress={handleAddMember}>
              <MaterialIcons name="person-add" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Add First Member</Text>
            </Pressable>
            
            <Pressable style={styles.secondaryButton} onPress={handleLoadDemo}>
              <MaterialIcons name="family-restroom" size={20} color={VanshColors.suvarna[600]} />
              <Text style={styles.secondaryButtonText}>Load Demo Family</Text>
            </Pressable>
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
  
  // ─── MAIN RENDER ───
  
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Floating Controls - Top Right */}
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={[styles.controls, { top: 12 }]}
      >
        <Pressable style={styles.controlButton} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          scale.value = withTiming(Math.min(scale.value * 1.4, MAX_SCALE), { duration: 250, easing: Easing.out(Easing.cubic) });
        }}>
          <MaterialIcons name="zoom-in" size={20} color={VanshColors.masi[600]} />
        </Pressable>
        
        <Pressable style={styles.controlButton} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          scale.value = withTiming(Math.max(scale.value * 0.7, MIN_SCALE), { duration: 250, easing: Easing.out(Easing.cubic) });
        }}>
          <MaterialIcons name="zoom-out" size={20} color={VanshColors.masi[600]} />
        </Pressable>
        
        <Pressable style={styles.controlButton} onPress={handleResetView}>
          <MaterialIcons name="center-focus-strong" size={20} color={VanshColors.masi[600]} />
        </Pressable>
        
        <Pressable
          style={[styles.controlButton, showLegend && styles.controlButtonActive]}
          onPress={() => setShowLegend(!showLegend)}
        >
          <MaterialIcons name="info-outline" size={20} color={showLegend ? '#FFF' : VanshColors.masi[600]} />
        </Pressable>
        
        {/* View As button */}
        <Pressable
          style={[styles.controlButton, { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: VanshColors.suvarna[200] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowViewAsPicker(true);
          }}
        >
          <MaterialIcons name="people" size={20} color={VanshColors.suvarna[600]} />
        </Pressable>
      </Animated.View>
      
      {/* Collapsible Legend */}
      {showLegend && (
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.legend, { top: 12, right: 12 }]}
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
            <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
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
      )}
      
      {/* Viewing As Indicator */}
      {currentRootMember && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.viewingAsBadge, { top: 12 }]}
        >
          <MaterialIcons name="visibility" size={14} color={VanshColors.suvarna[600]} />
          <Text style={styles.viewingAsText} numberOfLines={1}>
            Viewing as {currentRootMember.firstName}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowViewAsPicker(true);
            }}
            hitSlop={8}
          >
            <MaterialIcons name="swap-horiz" size={16} color={VanshColors.suvarna[500]} />
          </Pressable>
        </Animated.View>
      )}
      
      {/* Add Member FAB */}
      <Animated.View 
        entering={FadeInUp.duration(300)}
        style={[styles.fab, { bottom: insets.bottom + 100 }]}
      >
        <Pressable style={styles.fabButton} onPress={handleAddMember}>
          <MaterialIcons name="person-add" size={24} color="#FFF" />
        </Pressable>
      </Animated.View>
      
      {/* Relationship Badge */}
      {firstSelectedId && secondSelectedId && relationshipLabel && (() => {
        const firstMember = members.get(firstSelectedId);
        const secondMember = members.get(secondSelectedId);
        return (
          <Animated.View 
            entering={FadeInDown.duration(250)}
            style={styles.relationshipBadge}
          >
            <View style={styles.relationshipBadgeHeader}>
              <Text style={styles.relationshipBadgeLabel}>
                {firstMember?.firstName} → {secondMember?.firstName}
              </Text>
              <Pressable
                onPress={() => {
                  setFirstSelectedId(null);
                  setSecondSelectedId(null);
                  setSelectedMember(null);
                  setHighlightedPath([]);
                  setRelationshipLabel(null);
                }}
                hitSlop={12}
              >
                <MaterialIcons name="close" size={16} color={VanshColors.masi[400]} />
              </Pressable>
            </View>
            <Text style={styles.relationshipBadgeText}>{relationshipLabel}</Text>
          </Animated.View>
        );
      })()}
      
      {/* Tree Canvas */}
      <GestureDetector gesture={withDoubleTap}>
        <Animated.View
          style={[styles.canvas, canvasStyle, { width: canvasWidth, height: canvasHeight }]}
        >
          <AnimatedConnectionLines
            connectors={treeLayout.connectors}
            highlightedPath={highlightedPath}
            offsetX={offsetX}
            offsetY={offsetY}
            width={canvasWidth}
            height={canvasHeight}
          />
          
          {treeLayout.nodes.map((node) => {
            const isRoot = node.id === rootMemberId;
            const isSelected = node.id === firstSelectedId || node.id === secondSelectedId;
            const isHighlighted = highlightedPath.includes(node.id);
            
            return (
              <View
                key={node.id}
                style={[
                  styles.nodeWrapper,
                  { left: node.x + offsetX, top: node.y + offsetY },
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
      
      {/* Instructions */}
      <Animated.View 
        entering={FadeIn.delay(500).duration(300)}
        style={[styles.instructions, { bottom: insets.bottom + 88 }]}
      >
        <Text style={styles.instructionsText}>
          Tap two members to see their relationship · Double tap to reset view
        </Text>
      </Animated.View>
      
      {/* Add Member Modal */}
      <QuickAddMember
        visible={showAddModal}
        baseMember={addingToMember}
        onClose={() => {
          setShowAddModal(false);
          setAddingToMember(undefined);
        }}
      />
      
      {/* View As Member Picker */}
      <Modal
        visible={showViewAsPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowViewAsPicker(false)}
      >
        <View style={viewAsStyles.overlay}>
          <Pressable style={viewAsStyles.backdrop} onPress={() => {
            setShowViewAsPicker(false);
            setViewAsSearch('');
          }} />
          <View style={[viewAsStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={viewAsStyles.handle} />
            
            <View style={viewAsStyles.header}>
              <Text style={viewAsStyles.title}>👀 View Tree As...</Text>
              <Pressable
                style={viewAsStyles.closeBtn}
                onPress={() => {
                  setShowViewAsPicker(false);
                  setViewAsSearch('');
                }}
              >
                <MaterialIcons name="close" size={20} color={VanshColors.masi[400]} />
              </Pressable>
            </View>
            <Text style={viewAsStyles.subtitle}>
              Select a person to see the tree from their perspective
            </Text>
            
            <View style={viewAsStyles.searchBox}>
              <MaterialIcons name="search" size={18} color={VanshColors.masi[400]} />
              <TextInput
                style={viewAsStyles.searchInput}
                placeholder="Search members..."
                placeholderTextColor={VanshColors.masi[300]}
                value={viewAsSearch}
                onChangeText={setViewAsSearch}
                autoCorrect={false}
              />
              {viewAsSearch.length > 0 && (
                <Pressable onPress={() => setViewAsSearch('')}>
                  <MaterialIcons name="close" size={16} color={VanshColors.masi[400]} />
                </Pressable>
              )}
            </View>
            
            <Text style={viewAsStyles.countLabel}>
              {filteredViewAsMembers.length} member{filteredViewAsMembers.length !== 1 ? 's' : ''}
            </Text>
            
            <FlatList
              data={filteredViewAsMembers}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isCurrentRoot = item.id === rootMemberId;
                const genderColor = item.gender === 'male' ? '#3B82F6' : item.gender === 'female' ? '#EC4899' : '#9CA3AF';
                return (
                  <Pressable
                    style={[viewAsStyles.memberRow, isCurrentRoot && viewAsStyles.memberRowActive]}
                    onPress={() => handleViewAs(item.id)}
                  >
                    <View style={[viewAsStyles.avatar, { backgroundColor: genderColor + '18' }]}>
                      <Text style={[viewAsStyles.avatarText, { color: genderColor }]}>
                        {item.firstName[0]}{(item.lastName || '')[0] || ''}
                      </Text>
                    </View>
                    <View style={viewAsStyles.memberInfo}>
                      <Text style={[viewAsStyles.memberName, isCurrentRoot && viewAsStyles.memberNameActive]}>
                        {item.firstName} {item.lastName || ''}
                      </Text>
                      {item.occupation ? (
                        <Text style={viewAsStyles.memberDetail}>{item.occupation}</Text>
                      ) : item.birthPlace ? (
                        <Text style={viewAsStyles.memberDetail}>{item.birthPlace}</Text>
                      ) : null}
                    </View>
                    {isCurrentRoot && (
                      <View style={viewAsStyles.currentBadge}>
                        <Text style={viewAsStyles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                    <MaterialIcons name="chevron-right" size={20} color={VanshColors.masi[300]} />
                  </Pressable>
                );
              }}
              style={viewAsStyles.list}
              contentContainerStyle={viewAsStyles.listContent}
              ItemSeparatorComponent={() => <View style={viewAsStyles.separator} />}
              ListEmptyComponent={
                <View style={viewAsStyles.empty}>
                  <Text style={viewAsStyles.emptyText}>No members found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
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
    right: 12,
    zIndex: 100,
    gap: 6,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  controlButtonActive: {
    backgroundColor: VanshColors.suvarna[500],
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: VanshColors.suvarna[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: VanshColors.suvarna[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  
  // Legend
  legend: {
    position: 'absolute',
    left: 12,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLine: {
    width: 18,
    height: 3,
    borderRadius: 1.5,
  },
  legendDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 2,
  },
  legendText: {
    fontSize: 12,
    color: VanshColors.masi[500],
  },
  
  // Relationship Badge
  relationshipBadge: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: [{ translateX: -100 }],
    width: 200,
    zIndex: 100,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: VanshColors.suvarna[300],
  },
  relationshipBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  relationshipBadgeLabel: {
    fontSize: 11,
    color: VanshColors.masi[400],
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
    pointerEvents: 'none',
  },
  instructionsText: {
    fontSize: 11,
    color: VanshColors.masi[400],
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: VanshColors.suvarna[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: VanshColors.masi[800],
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 15,
    color: VanshColors.masi[400],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyActions: {
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.suvarna[500],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    gap: 8,
    shadowColor: VanshColors.suvarna[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
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
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    gap: 8,
    borderWidth: 1.5,
    borderColor: VanshColors.suvarna[200],
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: VanshColors.suvarna[700],
  },
  
  // Viewing As indicator
  viewingAsBadge: {
    position: 'absolute',
    left: 12,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: VanshColors.suvarna[200],
  },
  viewingAsText: {
    fontSize: 13,
    fontWeight: '600',
    color: VanshColors.suvarna[700],
    maxWidth: 120,
  },
});

// ═══════════════════════════════════════════════════════════
// VIEW AS PICKER STYLES (separate to keep main styles clean)
// ═══════════════════════════════════════════════════════════

const viewAsStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    minHeight: 300,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: VanshColors.masi[800],
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: VanshColors.masi[400],
    marginBottom: 12,
    lineHeight: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: VanshColors.masi[800],
    padding: 0,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 150,
  },
  listContent: {
    paddingBottom: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderRadius: 12,
  },
  memberRowActive: {
    backgroundColor: VanshColors.suvarna[50],
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: VanshColors.masi[800],
  },
  memberNameActive: {
    color: VanshColors.suvarna[700],
    fontWeight: '700',
  },
  memberDetail: {
    fontSize: 13,
    color: VanshColors.masi[400],
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: VanshColors.suvarna[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: VanshColors.masi[400],
  },
  countLabel: {
    fontSize: 12,
    color: VanshColors.masi[400],
    marginBottom: 4,
    marginTop: 4,
  },
});

export default EnhancedFamilyTree;
