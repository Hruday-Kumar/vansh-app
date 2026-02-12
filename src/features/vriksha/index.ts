/**
 * 🪷 VRIKSHA FEATURE - Family Tree
 * ═══════════════════════════════════════════════════════════
 * 
 * Local-first family tree with stunning animations.
 * 
 * ARCHITECTURE:
 * ✓ VrikshaStore - Local-first state with graph-based relations
 * ✓ EnhancedFamilyTree - Gesture-based visualization
 * ✓ AnimatedMemberNode - Animated member cards
 * ✓ AnimatedConnectionLines - Animated SVG connections
 * ✓ QuickAddMember - Layman-friendly add flow
 * ✓ MemberDetailSheet - Member profile bottom sheet
 */

// State Management (Local-First)
export {
    generateDemoFamily,
    useVrikshaStore,
    type BasicRelationType,
    type FamilyMember,
    type StoredRelation,
    type VrikshaState
} from './vriksha-store';

// Main Tree Component
export { EnhancedFamilyTree } from './enhanced-family-tree';
export type { EnhancedFamilyTreeProps } from './enhanced-family-tree';

// Animated Components
export { AnimatedConnectionLines } from './animated-connection-lines';
export { AnimatedMemberNode } from './animated-member-node';

// Modals & Sheets
export { MemberDetailSheet } from './member-detail-sheet';
export type { MemberDetailSheetProps } from './member-detail-sheet';
export { QuickAddMember } from './quick-add-member';

// Types
export type {
    Connector, FamilyNode,
    LayoutNode, PersonData, TreeLayout, TreeViewState
} from './types';

export type {
    FamilyRelation, Gender,
    RelationshipType
} from './types';

// Layout utilities
export { calculateTreeLayout, membersToFamilyNodes } from './tree-layout';

// Relationship resolver
export {
    findRelationshipPath,
    formatRelationship,
    getDirectRelationshipTerm,
    resolveRelationship
} from './relationship-resolver';

