/**
 * 🌳 FAMILY TREE - Main Visualization Component
 * ═══════════════════════════════════════════════════════════
 * 
 * Features:
 * ✓ HIERARCHICAL LAYOUT - Parents ABOVE, Children BELOW
 * ✓ Gesture-based pan and zoom
 * ✓ SVG orthogonal bracket-style connections
 * ✓ Visual distinction for living/deceased
 * ✓ Dynamic Indian relationship labels on hover/selection
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useFamilyStore } from '../../state';
import { VanshColors, VanshSpacing } from '../../theme';
import type { FamilyId, MemberId, VrikshaMember } from '../../types';
import { ConnectionLines } from './connection-lines';
import { MemberNode } from './member-node';
import {
  findRelationshipPath,
  formatRelationship,
  resolveRelationship,
  type NodeRelations
} from './relationship-resolver';
import { calculateTreeLayout, membersToFamilyNodes, NODE_HEIGHT, NODE_WIDTH } from './tree-layout';
import type { Gender, LayoutNode, TreeLayout } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════
// TEST MODE - Use hardcoded clean data to verify visualization
// ═══════════════════════════════════════════════════════════
const USE_TEST_DATA = false;  // Toggle this to switch between test/real data

/**
 * Clean 3-generation test family:
 * 
 *     Gen 0:    Grandpa ═══ Grandma
 *                    │
 *     Gen 1:    Dad ═══ Mom      Uncle
 *                  │
 *     Gen 2:   Son    Daughter
 */
function getTestFamilyData(): { members: VrikshaMember[], rootId: MemberId } {
  const testFamilyId = 'test-family-001' as FamilyId;
  const grandpaId = 'grandpa-001' as MemberId;
  const grandmaId = 'grandma-001' as MemberId;
  const dadId = 'dad-001' as MemberId;
  const momId = 'mom-001' as MemberId;
  const uncleId = 'uncle-001' as MemberId;
  const sonId = 'son-001' as MemberId;
  const daughterId = 'daughter-001' as MemberId;

  const defaultPrana = { strength: 1, sharedMemories: [], sharedKathas: [], pulseIntensity: 1, glowColor: '#FFD700' };

  // Minimal test data cast through unknown to bypass strict type checking
  const members = [
    {
      id: grandpaId,
      familyId: testFamilyId,
      firstName: 'Ramu',
      lastName: 'Sharma',
      gender: 'male',
      birthDate: '1940-01-15',
      isAlive: false,
      nicknames: [],
      memoryCount: 0,
      kathaCount: 0,
      hasVoiceSamples: false,
      relationships: [
        { memberId: grandmaId, type: 'spouse', prana: defaultPrana },
        { memberId: dadId, type: 'parent', prana: defaultPrana },
        { memberId: uncleId, type: 'parent', prana: defaultPrana },
      ],
    },
    {
      id: grandmaId,
      familyId: testFamilyId,
      firstName: 'Sita',
      lastName: 'Sharma',
      maidenName: 'Devi',
      gender: 'female',
      birthDate: '1945-05-20',
      isAlive: false,
      nicknames: [],
      memoryCount: 0,
      kathaCount: 0,
      hasVoiceSamples: false,
      relationships: [
        { memberId: grandpaId, type: 'spouse', prana: defaultPrana },
        { memberId: dadId, type: 'parent', prana: defaultPrana },
        { memberId: uncleId, type: 'parent', prana: defaultPrana },
      ],
    },
    {
      id: dadId,
      familyId: testFamilyId,
      firstName: 'Vijay',
      lastName: 'Sharma',
      gender: 'male',
      birthDate: '1970-03-10',
      isAlive: true,
      nicknames: [],
      memoryCount: 0,
      kathaCount: 0,
      hasVoiceSamples: false,
      relationships: [
        { memberId: grandpaId, type: 'child', prana: defaultPrana },
        { memberId: grandmaId, type: 'child', prana: defaultPrana },
        { memberId: momId, type: 'spouse', prana: defaultPrana },
        { memberId: sonId, type: 'parent', prana: defaultPrana },
        { memberId: daughterId, type: 'parent', prana: defaultPrana },
        { memberId: uncleId, type: 'sibling', prana: defaultPrana },
      ],
    },
    {
      id: momId,
      familyId: testFamilyId,
      firstName: 'Priya',
      lastName: 'Sharma',
      maidenName: 'Kapoor',
      gender: 'female',
      birthDate: '1975-08-25',
      isAlive: true,
      nicknames: [],
      memoryCount: 0,
      kathaCount: 0,
      hasVoiceSamples: false,
      relationships: [
        { memberId: dadId, type: 'spouse', prana: defaultPrana },
        { memberId: sonId, type: 'parent', prana: defaultPrana },
        { memberId: daughterId, type: 'parent', prana: defaultPrana },
      ],
    },
    {
      id: uncleId,
      familyId: testFamilyId,
      firstName: 'Ajay',
      lastName: 'Sharma',
      gender: 'male',
      birthDate: '1972-11-05',
      isAlive: true,
      nicknames: [],
      memoryCount: 0,
      kathaCount: 0,
      hasVoiceSamples: false,
      relationships: [
        { memberId: grandpaId, type: 'child', prana: defaultPrana },
        { memberId: grandmaId, type: 'child', prana: defaultPrana },
        { memberId: dadId, type: 'sibling', prana: defaultPrana },
      ],
    },
    {
      id: sonId,
      familyId: testFamilyId,
      firstName: 'Arjun',
      lastName: 'Sharma',
      gender: 'male',
      birthDate: '2000-01-15',
      isAlive: true,
      nicknames: [],
      memoryCount: 0,
      kathaCount: 0,
      hasVoiceSamples: false,
      relationships: [
        { memberId: dadId, type: 'child', prana: defaultPrana },
        { memberId: momId, type: 'child', prana: defaultPrana },
        { memberId: daughterId, type: 'sibling', prana: defaultPrana },
      ],
    },
    {
      id: daughterId,
      familyId: testFamilyId,
      firstName: 'Ananya',
      lastName: 'Sharma',
      gender: 'female',
      birthDate: '2003-04-20',
      isAlive: true,
      nicknames: [],
      memoryCount: 0,
      kathaCount: 0,
      hasVoiceSamples: false,
      relationships: [
        { memberId: dadId, type: 'child', prana: defaultPrana },
        { memberId: momId, type: 'child', prana: defaultPrana },
        { memberId: sonId, type: 'sibling', prana: defaultPrana },
      ],
    },
  ] as unknown as VrikshaMember[];

  return { members, rootId: grandpaId };
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const INITIAL_SCALE = 0.7;  // Good initial zoom level to see multiple nodes

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════

export interface FamilyTreeProps {
  onMemberPress?: (member: VrikshaMember) => void;
  onAddMember?: () => void;
  rootMemberId?: string;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export function FamilyTree({
  onMemberPress,
  onAddMember,
  rootMemberId,
}: FamilyTreeProps) {
  const { membersList: realMembersList } = useFamilyStore();
  
  // Use test data or real data based on flag
  const testData = USE_TEST_DATA ? getTestFamilyData() : null;
  const membersList = USE_TEST_DATA ? testData!.members : realMembersList;
  const effectiveRootId = USE_TEST_DATA ? testData!.rootId : rootMemberId;
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredRelationship, setHoveredRelationship] = useState<string | null>(null);
  
  // Gesture state
  const scale = useSharedValue(INITIAL_SCALE);
  const savedScale = useSharedValue(INITIAL_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  
  // Calculate tree layout - THE CORE OF HIERARCHICAL VISUALIZATION
  const treeLayout = useMemo<TreeLayout>(() => {
    if (membersList.length === 0) {
      return { nodes: [], connectors: [], bounds: { width: 0, height: 0, minX: 0, minY: 0 } };
    }
    
    // Extract relationships from member data
    // KEEP ORIGINAL TYPES to preserve generation depth (grandparent vs parent)
    const relArray: { fromId: string; toId: string; type: string }[] = [];
    membersList.forEach(m => {
      m.relationships?.forEach(rel => {
        // Keep the original type (grandparent, parent, child, etc.)
        // The tree layout algorithm will handle generation calculation
        relArray.push({
          fromId: m.id,
          toId: rel.memberId as string,
          type: rel.type, // Keep original type for proper generation depth
        });
      });
    });
    
    // DEBUG: Log relationships for troubleshooting
    console.log('🌳 [FamilyTree] TEST MODE:', USE_TEST_DATA);
    console.log('🌳 [FamilyTree] Members:', membersList.length);
    
    // Create ID to Name mapping for easier debugging
    const idToName = new Map<string, string>();
    membersList.forEach(m => idToName.set(m.id, m.firstName));
    
    // Log each member's relationships with NAMES
    console.log('🌳 [FamilyTree] Member relationships:');
    membersList.forEach(m => {
      if (m.relationships && m.relationships.length > 0) {
        const rels = m.relationships.map(r => {
          const toName = idToName.get(r.memberId as string) || 'Unknown';
          return `${r.type}→${toName}(${(r.memberId as string).substring(0, 8)})`;
        }).join(', ');
        console.log(`   ${m.firstName}(${m.id.substring(0, 8)}): ${rels}`);
      }
    });
    
    console.log('🌳 [FamilyTree] Relationships found:', relArray.length);
    if (relArray.length > 0) {
      console.log('🌳 [FamilyTree] Sample relationships:', JSON.stringify(relArray.slice(0, 5)));
    } else {
      console.log('🌳 [FamilyTree] ⚠️ NO RELATIONSHIPS - checking member data:');
      membersList.forEach(m => {
        console.log(`   Member ${m.firstName}: relationships =`, m.relationships?.length ?? 0);
      });
    }
    
    // Convert members to tree-compatible format
    const { nodes, personData } = membersToFamilyNodes(membersList, relArray);
    
    // DEBUG: Log what nodes look like after conversion
    console.log('🌳 [FamilyTree] Nodes after conversion:');
    nodes.forEach(n => {
      if (n.parents.length > 0 || n.children.length > 0) {
        console.log(`   ${personData.get(n.id)?.firstName}: parents=${n.parents.length}, children=${n.children.length}, spouses=${n.spouses.length}`);
      }
    });
    
    // Determine root (use provided or first member)
    const rootId = effectiveRootId || membersList[0]?.id;
    
    if (!rootId) {
      return { nodes: [], connectors: [], bounds: { width: 0, height: 0, minX: 0, minY: 0 } };
    }
    
    console.log('🌳 [FamilyTree] Root ID:', rootId);
    
    // Calculate hierarchical layout
    const layout = calculateTreeLayout(nodes, personData, rootId);
    
    // DEBUG: Log layout results
    console.log('🌳 [FamilyTree] Layout result:');
    console.log(`   Nodes: ${layout.nodes.length}, Connectors: ${layout.connectors.length}`);
    const generations = new Set(layout.nodes.map(n => n.generation));
    console.log(`   Generations found: ${Array.from(generations).sort().join(', ')}`);
    
    // Log node positions for debugging
    layout.nodes.forEach(n => {
      console.log(`   ${n.person?.firstName}: gen=${n.generation}, x=${n.x.toFixed(0)}, y=${n.y.toFixed(0)}`);
    });
    
    return layout;
  }, [membersList, effectiveRootId]);
  
  // Lookup for original member data
  const memberMap = useMemo(() => {
    const map = new Map<string, VrikshaMember>();
    membersList.forEach(m => map.set(m.id, m));
    return map;
  }, [membersList]);
  
  // Create relation lookup for path finding
  const relationLookup = useMemo(() => {
    const lookup = new Map<string, NodeRelations>();
    
    treeLayout.nodes.forEach(node => {
      const relations: NodeRelations = {
        parents: node.parents.map(p => ({
          id: p.id,
          gender: (treeLayout.nodes.find(n => n.id === p.id)?.gender || 'other') as Gender,
        })),
        children: node.children.map(c => ({
          id: c.id,
          gender: (treeLayout.nodes.find(n => n.id === c.id)?.gender || 'other') as Gender,
        })),
        spouses: node.spouses.map(s => ({
          id: s.id,
          gender: (treeLayout.nodes.find(n => n.id === s.id)?.gender || 'other') as Gender,
        })),
        siblings: node.siblings.map(s => ({
          id: s.id,
          gender: (treeLayout.nodes.find(n => n.id === s.id)?.gender || 'other') as Gender,
        })),
      };
      lookup.set(node.id, relations);
    });
    
    return lookup;
  }, [treeLayout.nodes]);
  
  // Gender lookup helper
  const getGender = useCallback((id: string): Gender => {
    const node = treeLayout.nodes.find(n => n.id === id);
    return (node?.gender || 'other') as Gender;
  }, [treeLayout.nodes]);
  
  // Get relations helper
  const getRelations = useCallback((id: string): NodeRelations => {
    return relationLookup.get(id) || { parents: [], children: [], spouses: [], siblings: [] };
  }, [relationLookup]);
  
  // Handle node press - compute relationship dynamically
  const handleNodePress = useCallback((node: LayoutNode) => {
    const actualRootId = effectiveRootId || membersList[0]?.id;
    
    if (node.id === actualRootId) {
      // Clicked on root - clear selection
      setSelectedNodeId(null);
      setHoveredRelationship(null);
    } else {
      setSelectedNodeId(prev => prev === node.id ? null : node.id);
      
      // Compute relationship path from root to selected node
      if (actualRootId && node.id !== actualRootId) {
        const path = findRelationshipPath(
          actualRootId,
          node.id,
          getRelations,
          getGender
        );
        
        if (path && path.length > 0) {
          const rootGender = getGender(actualRootId);
          const nodeGender = getGender(node.id);
          const relationship = resolveRelationship(path, rootGender, nodeGender);
          
          if (relationship) {
            setHoveredRelationship(formatRelationship(relationship));
          }
        }
      }
    }
    
    const member = memberMap.get(node.id);
    if (member && onMemberPress) {
      onMemberPress(member);
    }
  }, [memberMap, onMemberPress, effectiveRootId, membersList, getRelations, getGender]);
  
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
      // Reset view to center
      scale.value = withSpring(INITIAL_SCALE);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });
  
  const composedGestures = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );
  
  // Animated style for the tree container
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));
  
  // ═══════════ EMPTY STATE ═══════════
  if (membersList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>🌱</Text>
          </View>
          <Text style={styles.emptyTitle}>Start Your Family Tree</Text>
          <Text style={styles.emptyDescription}>
            Add your first family member to begin building your heritage tree.
            {'\n\n'}
            Tap the "Add Member" button above to get started!
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={onAddMember}>
            <Text style={styles.emptyButtonText}>+ Add First Member</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Calculate canvas size based on tree bounds
  // Canvas should be large enough to hold all nodes plus padding for panning
  const canvasWidth = Math.max(SCREEN_WIDTH, treeLayout.bounds.width + 200);
  const canvasHeight = Math.max(SCREEN_HEIGHT, treeLayout.bounds.height + 200);
  
  // Offset to position the leftmost node at X=20 (small margin from left edge)
  // This ensures nodes are VISIBLE on screen initially
  const offsetX = 20 - treeLayout.bounds.minX;
  const offsetY = 20 - treeLayout.bounds.minY;  // Start tree 20px from top
  
  // Find the root member ID (first one or provided)
  const actualRootId = effectiveRootId || membersList[0]?.id;
  
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ═══════════ ZOOM CONTROLS ═══════════ */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            scale.value = withSpring(Math.min(scale.value + 0.2, MAX_SCALE));
          }}
        >
          <Text style={styles.controlText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            scale.value = withSpring(Math.max(scale.value - 0.2, MIN_SCALE));
          }}
        >
          <Text style={styles.controlText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            scale.value = withSpring(INITIAL_SCALE);
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
          }}
        >
          <Text style={styles.controlText}>⊙</Text>
        </TouchableOpacity>
      </View>
      
      {/* ═══════════ LEGEND ═══════════ */}
      <View style={styles.legend}>
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
          <View style={[styles.legendLine, { backgroundColor: '#E11D48' }]} />
          <Text style={styles.legendText}>Married</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#6366F1' }]} />
          <Text style={styles.legendText}>Parent-Child</Text>
        </View>
      </View>
      
      {/* ═══════════ SELECTED RELATIONSHIP BADGE ═══════════ */}
      {selectedNodeId && hoveredRelationship && (
        <View style={styles.relationshipBadge}>
          <Text style={styles.relationshipLabel}>Relationship to You:</Text>
          <Text style={styles.relationshipText}>{hoveredRelationship}</Text>
        </View>
      )}
      
      {/* ═══════════ TREE CANVAS ═══════════ */}
      <GestureDetector gesture={composedGestures}>
        <Animated.View 
          style={[
            styles.canvas, 
            animatedStyle, 
            { width: canvasWidth, height: canvasHeight }
          ]}
        >
          {/* ═══════════ CONNECTION LINES (SVG) ═══════════ */}
          <ConnectionLines
            connectors={treeLayout.connectors}
            offsetX={offsetX}
            offsetY={offsetY}
            width={canvasWidth}
            height={canvasHeight}
          />
          
          {/* ═══════════ MEMBER NODES ═══════════ */}
          {treeLayout.nodes.map((node: LayoutNode) => {
            const isRoot = node.id === actualRootId;
            
            return (
              <View
                key={node.id}
                style={[
                  styles.nodeWrapper,
                  {
                    left: node.x + offsetX,
                    top: node.y + offsetY,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                  },
                ]}
              >
                <MemberNode
                  node={node}
                  isRoot={isRoot}
                  isSelected={selectedNodeId === node.id}
                  onPress={handleNodePress}
                />
              </View>
            );
          })}
        </Animated.View>
      </GestureDetector>
      
      {/* ═══════════ INSTRUCTIONS ═══════════ */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Pinch to zoom • Drag to pan • Double tap to reset
        </Text>
      </View>
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
  },
  nodeWrapper: {
    position: 'absolute',
  },
  
  // Controls
  controls: {
    position: 'absolute',
    top: VanshSpacing.md,
    right: VanshSpacing.md,
    zIndex: 100,
    gap: VanshSpacing.xs,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: VanshSpacing.xs,
  },
  controlText: {
    fontSize: 22,
    fontWeight: '600',
    color: VanshColors.masi[700],
  },
  
  // Legend
  legend: {
    position: 'absolute',
    top: VanshSpacing.md,
    left: VanshSpacing.md,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: VanshSpacing.sm,
    gap: VanshSpacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  
  // Relationship Badge (shown when node is selected)
  relationshipBadge: {
    position: 'absolute',
    top: VanshSpacing.md,
    left: '50%',
    transform: [{ translateX: -100 }],
    width: 200,
    zIndex: 100,
    backgroundColor: VanshColors.suvarna[100],
    borderRadius: 12,
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
  relationshipLabel: {
    fontSize: 11,
    color: VanshColors.masi[500],
    marginBottom: 2,
  },
  relationshipText: {
    fontSize: 16,
    fontWeight: '700',
    color: VanshColors.suvarna[700],
    textAlign: 'center',
  },
  
  // Instructions
  instructions: {
    position: 'absolute',
    bottom: VanshSpacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 12,
    color: VanshColors.masi[400],
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.xs,
    borderRadius: 16,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: VanshSpacing.xl,
    backgroundColor: VanshColors.khadi[50],
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: VanshColors.suvarna[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: VanshSpacing.lg,
  },
  emptyEmoji: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginBottom: VanshSpacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: VanshColors.masi[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: VanshSpacing.lg,
  },
  emptyButton: {
    backgroundColor: VanshColors.suvarna[500],
    paddingHorizontal: VanshSpacing.lg,
    paddingVertical: VanshSpacing.md,
    borderRadius: 25,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

// Re-export types
export * from './types';

