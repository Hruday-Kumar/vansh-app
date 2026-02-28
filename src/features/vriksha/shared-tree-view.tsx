/**
 * 🌳 SHARED TREE VIEW - Family Tree Viewer (Preview + Import)
 * ═══════════════════════════════════════════════════════════
 * 
 * Displays a family tree from a ShareToken snapshot.
 * 
 * Modes:
 *   - view_only: Read-only tree visualization
 *   - invite_to_join: View + "Import & Add Members" CTA
 *     When imported, members go into VrikshaStore so the
 *     recipient can add their own family members normally.
 * 
 * Features:
 * - Renders same tree layout as EnhancedFamilyTree
 * - Pan & zoom gestures for navigation
 * - Auto-centers on the shared member
 * - "Import & Add Members" CTA for editable shares
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VanshColors, VanshRadius } from '../../theme';
import { AnimatedConnectionLines } from './animated-connection-lines';
import { AnimatedMemberNode } from './animated-member-node';
import type { ShareToken } from './share-service';
import { calculateTreeLayout, membersToFamilyNodes } from './tree-layout';
import type { LayoutNode, TreeLayout } from './types';
import type { FamilyMember, StoredRelation } from './vriksha-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MIN_SCALE = 0.1;
const MAX_SCALE = 2.0;
const INITIAL_SCALE = 0.5;

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface SharedTreeViewProps {
  visible: boolean;
  shareToken: ShareToken | null;
  onClose: () => void;
  onJoinRequest?: () => void;     // Legacy: join request flow
  onImportTree?: () => void;      // New: import tree to VrikshaStore
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function SharedTreeView({ visible, shareToken, onClose, onJoinRequest, onImportTree }: SharedTreeViewProps) {
  const insets = useSafeAreaInsets();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedMemberInfo, setSelectedMemberInfo] = useState<FamilyMember | null>(null);

  // ── Build tree layout from snapshot ──
  const treeLayout = useMemo<TreeLayout | null>(() => {
    if (!shareToken?.treeSnapshot) return null;

    const { members, relations, rootMemberId } = shareToken.treeSnapshot;
    if (!members || members.length === 0) return null;

    // Convert stored relations to the format membersToFamilyNodes expects
    const relationships = relations.map((r: StoredRelation) => ({
      fromId: r.fromMemberId,
      toId: r.toMemberId,
      type: r.type,
    }));

    const { nodes, personData } = membersToFamilyNodes(members, relationships);
    const layout = calculateTreeLayout(nodes, personData, rootMemberId);
    return layout;
  }, [shareToken]);

  const memberMap = useMemo(() => {
    if (!shareToken?.treeSnapshot?.members) return new Map<string, FamilyMember>();
    const map = new Map<string, FamilyMember>();
    shareToken.treeSnapshot.members.forEach(m => map.set(m.id, m));
    return map;
  }, [shareToken]);

  // ── Gesture values ──
  const scale = useSharedValue(INITIAL_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(INITIAL_SCALE);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Auto-center on open
  useEffect(() => {
    if (visible && treeLayout && treeLayout.nodes.length > 0) {
      const centerX = -(treeLayout.bounds.minX + treeLayout.bounds.width / 2) * INITIAL_SCALE + SCREEN_WIDTH / 2;
      const centerY = -(treeLayout.bounds.minY + treeLayout.bounds.height / 2) * INITIAL_SCALE + SCREEN_HEIGHT / 2;

      translateX.value = withSpring(centerX, { damping: 20 });
      translateY.value = withSpring(centerY, { damping: 20 });
      savedTranslateX.value = centerX;
      savedTranslateY.value = centerY;
      scale.value = INITIAL_SCALE;
      savedScale.value = INITIAL_SCALE;
    }
  }, [visible, treeLayout]);

  // ── Gestures (pan + pinch) ──
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
      scale.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const treeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleNodePress = useCallback((node: LayoutNode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const member = memberMap.get(node.id);
    if (member) {
      setSelectedNodeId(node.id);
      setSelectedMemberInfo(member);
    }
  }, [memberMap]);

  const handleZoom = useCallback((zoomIn: boolean) => {
    const factor = zoomIn ? 1.3 : 0.75;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor));
    scale.value = withSpring(newScale, { damping: 15 });
    savedScale.value = newScale;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  if (!shareToken || !treeLayout) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={[styles.full, styles.centerContent]}>
          <ActivityIndicator size="large" color={VanshColors.suvarna[500]} />
          <Text style={styles.loadingText}>Loading tree…</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.full}>
        <View style={[styles.full, { backgroundColor: VanshColors.khadi[100] }]}>

          {/* ── Top bar ── */}
          <Animated.View
            entering={FadeIn.delay(200)}
            style={[styles.topBar, { paddingTop: insets.top + 8 }]}
          >
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <MaterialIcons name="arrow-back" size={22} color={VanshColors.masi[700]} />
            </TouchableOpacity>
            <View style={styles.topBarCenter}>
              <Text style={styles.topBarTitle}>{shareToken.memberName}'s Tree</Text>
              <View style={styles.badge}>
                <MaterialIcons
                  name={shareToken.mode === 'view_only' ? 'visibility' : 'person-add'}
                  size={12}
                  color={shareToken.mode === 'view_only' ? '#3B82F6' : '#22C55E'}
                />
                <Text style={[
                  styles.badgeText,
                  { color: shareToken.mode === 'view_only' ? '#3B82F6' : '#22C55E' }
                ]}>
                  {shareToken.mode === 'view_only' ? 'View Only' : 'Invite'}
                </Text>
              </View>
            </View>
            <View style={{ width: 44 }} />
          </Animated.View>

          {/* ── Tree canvas ── */}
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.treeCanvas, treeStyle]}>
              {/* Connection lines */}
              <AnimatedConnectionLines
                connectors={treeLayout.connectors}
                highlightedPath={[]}
                offsetX={0}
                offsetY={0}
                width={treeLayout.bounds.width + 200}
                height={treeLayout.bounds.height + 200}
              />

              {/* Member nodes */}
              {treeLayout.nodes.map((node) => (
                <AnimatedMemberNode
                  key={node.id}
                  node={node}
                  isRoot={node.id === shareToken.treeSnapshot?.rootMemberId}
                  isSelected={node.id === selectedNodeId}
                  isHighlighted={false}
                  onPress={handleNodePress}
                />
              ))}
            </Animated.View>
          </GestureDetector>

          {/* ── Zoom controls ── */}
          <Animated.View entering={FadeInDown.delay(300)} style={[styles.zoomControls, { top: insets.top + 70 }]}>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom(true)}>
              <MaterialIcons name="zoom-in" size={20} color={VanshColors.masi[600]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom(false)}>
              <MaterialIcons name="zoom-out" size={20} color={VanshColors.masi[600]} />
            </TouchableOpacity>
          </Animated.View>

          {/* ── Member count ── */}
          <Animated.View entering={FadeIn.delay(400)} style={[styles.memberCountBadge, { top: insets.top + 70 }]}>
            <MaterialIcons name="people" size={14} color={VanshColors.masi[500]} />
            <Text style={styles.memberCountText}>
              {treeLayout.nodes.length} members
            </Text>
          </Animated.View>

          {/* ── Selected member mini-card ── */}
          {selectedMemberInfo && (
            <Animated.View
              entering={FadeInDown.springify()}
              exiting={FadeOut}
              style={[styles.miniCard, { bottom: (shareToken.mode === 'invite_to_join' ? 100 : 40) + insets.bottom }]}
            >
              <View style={styles.miniCardContent}>
                <View style={[
                  styles.miniAvatar,
                  { backgroundColor: selectedMemberInfo.gender === 'male' ? '#EFF6FF' : '#FDF2F8' }
                ]}>
                  <Text style={styles.miniAvatarText}>
                    {selectedMemberInfo.firstName?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.miniCardInfo}>
                  <Text style={styles.miniCardName}>
                    {selectedMemberInfo.firstName} {selectedMemberInfo.lastName || ''}
                  </Text>
                  {selectedMemberInfo.birthDate && (
                    <Text style={styles.miniCardDetail}>
                      Born: {new Date(selectedMemberInfo.birthDate).getFullYear()}
                    </Text>
                  )}
                  {selectedMemberInfo.occupation && (
                    <Text style={styles.miniCardDetail}>{selectedMemberInfo.occupation}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.miniCardClose}
                  onPress={() => { setSelectedNodeId(null); setSelectedMemberInfo(null); }}
                >
                  <MaterialIcons name="close" size={18} color={VanshColors.masi[400]} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* ── CTA for editable shares ── */}
          {shareToken.mode === 'invite_to_join' && (onImportTree || onJoinRequest) && (
            <Animated.View
              entering={FadeInDown.delay(500).springify()}
              style={[styles.joinCta, { bottom: 20 + insets.bottom }]}
            >
              <Pressable
                style={styles.joinButton}
                onPress={onImportTree || onJoinRequest}
              >
                <MaterialIcons name="download" size={20} color="#FFF" />
                <Text style={styles.joinButtonText}>Import & Add Members</Text>
              </Pressable>
              <Text style={styles.joinHint}>
                Import this tree and add your own family members
              </Text>
            </Animated.View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  full: { flex: 1 },
  centerContent: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  loadingText: { marginTop: 12, fontSize: 15, color: VanshColors.masi[500] },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: VanshColors.masi[800] },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
    backgroundColor: '#F9FAFB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Tree canvas
  treeCanvas: {
    position: 'absolute', top: 0, left: 0,
  },

  // Zoom controls
  zoomControls: {
    position: 'absolute', right: 16, zIndex: 5,
    backgroundColor: '#FFF', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  zoomBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },

  // Member count
  memberCountBadge: {
    position: 'absolute', left: 16, zIndex: 5,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  memberCountText: { fontSize: 12, fontWeight: '600', color: VanshColors.masi[500] },

  // Mini card
  miniCard: {
    position: 'absolute', left: 20, right: 20, zIndex: 10,
    backgroundColor: '#FFF', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  miniCardContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  miniAvatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  miniAvatarText: { fontSize: 18, fontWeight: '700', color: VanshColors.masi[600] },
  miniCardInfo: { flex: 1 },
  miniCardName: { fontSize: 15, fontWeight: '700', color: VanshColors.masi[800] },
  miniCardDetail: { fontSize: 12, color: VanshColors.masi[400], marginTop: 2 },
  miniCardClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },

  // Join CTA
  joinCta: {
    position: 'absolute', left: 20, right: 20, zIndex: 10,
  },
  joinButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E', paddingVertical: 16,
    borderRadius: VanshRadius.lg, gap: 8,
    shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  joinButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  joinHint: {
    fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 6,
  },
});
