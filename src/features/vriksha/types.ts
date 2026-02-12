/**
 * 🌳 VRIKSHA TYPES - Family Tree Data Structures
 * ═══════════════════════════════════════════════════════════
 * 
 * Based on industry-standard genealogy patterns (GEDCOM-inspired)
 * with comprehensive Indian family relationship system.
 * ALL LABELS IN ENGLISH
 */

// ═══════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════

export type Gender = 'male' | 'female' | 'other';

export type RelationshipType =
  | 'blood'      // Biological relationship
  | 'married'    // Current spouse
  | 'divorced'   // Former spouse
  | 'adopted'    // Adopted child/parent
  | 'half'       // Half-sibling (one common parent)
  | 'step';      // Step-parent/child

export interface FamilyRelation {
  id: string;           // ID of the related person
  type: RelationshipType;
}

/**
 * Core node structure compatible with relatives-tree library
 */
export interface FamilyNode {
  id: string;
  gender: Gender;

  // Relationship arrays (for tree calculation)
  parents: FamilyRelation[];
  children: FamilyRelation[];
  siblings: FamilyRelation[];
  spouses: FamilyRelation[];
  cousins: FamilyRelation[];

  // Extended data
  placeholder?: boolean;   // For unknown/missing relatives
}

/**
 * Extended person data for display
 */
export interface PersonData {
  id: string;

  // Name
  firstName: string;
  lastName: string;
  maidenName?: string;
  nicknames?: string[];

  // Demographics
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  isAlive: boolean;

  // Places
  birthPlace?: string;
  currentCity?: string;

  // Profile
  photoUri?: string;
  occupation?: string;
  bio?: string;

  // Indian-specific
  gotra?: string;          // Family lineage
  nativeVillage?: string;  // Ancestral village

  // Stats
  memoryCount?: number;
  kathaCount?: number;
}

// ═══════════════════════════════════════════════════════════
// TREE LAYOUT TYPES
// ═══════════════════════════════════════════════════════════

export interface LayoutNode extends FamilyNode {
  // Position (calculated by layout algorithm)
  x: number;
  y: number;

  // Layout info
  generation: number;     // 0 = root, -1 = parent, +1 = child
  column: number;         // Position in generation row

  // Relationship to root (for display)
  relationToRoot?: string;

  // Extended display data
  person?: PersonData;
}

export interface Connector {
  type: 'parent-child' | 'spouse' | 'sibling';
  from: { id: string; x: number; y: number };
  to: { id: string; x: number; y: number };
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  label?: string;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  connectors: Connector[];
  bounds: {
    width: number;
    height: number;
    minX: number;
    minY: number;
  };
}

// ═══════════════════════════════════════════════════════════
// COMPREHENSIVE RELATIONSHIP CATEGORIES (ENGLISH)
// For the Add Member form - Grouped by category
// ═══════════════════════════════════════════════════════════

export interface RelationshipOption {
  value: string;
  label: string;
  description: string;
  emoji: string;
  category: RelationshipCategory;
  gender?: Gender;
  side?: 'paternal' | 'maternal';
}

export type RelationshipCategory =
  | 'immediate'     // Parent, Child, Spouse, Sibling
  | 'grandparent'   // Grandparents
  | 'grandchild'    // Grandchildren
  | 'uncle_aunt'    // Uncles & Aunts (both sides)
  | 'cousin'        // Cousins
  | 'in_law'        // In-laws
  | 'niece_nephew'  // Nieces & Nephews
  | 'extended';     // Great-grandparents, etc.

/**
 * COMPREHENSIVE English relationship options for the form
 * Organized by category for easy selection
 */
export const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  // ══════════ IMMEDIATE FAMILY ══════════
  { value: 'father', label: 'Father', description: 'Biological or adoptive father', emoji: '👨', category: 'immediate', gender: 'male' },
  { value: 'mother', label: 'Mother', description: 'Biological or adoptive mother', emoji: '👩', category: 'immediate', gender: 'female' },
  { value: 'son', label: 'Son', description: 'Male child', emoji: '👦', category: 'immediate', gender: 'male' },
  { value: 'daughter', label: 'Daughter', description: 'Female child', emoji: '👧', category: 'immediate', gender: 'female' },
  { value: 'husband', label: 'Husband', description: 'Male spouse', emoji: '💑', category: 'immediate', gender: 'male' },
  { value: 'wife', label: 'Wife', description: 'Female spouse', emoji: '💑', category: 'immediate', gender: 'female' },
  { value: 'brother', label: 'Brother', description: 'Male sibling', emoji: '👦', category: 'immediate', gender: 'male' },
  { value: 'sister', label: 'Sister', description: 'Female sibling', emoji: '👧', category: 'immediate', gender: 'female' },

  // ══════════ GRANDPARENTS ══════════
  { value: 'paternal_grandfather', label: 'Grandfather (Paternal)', description: "Father's father", emoji: '👴', category: 'grandparent', gender: 'male', side: 'paternal' },
  { value: 'paternal_grandmother', label: 'Grandmother (Paternal)', description: "Father's mother", emoji: '👵', category: 'grandparent', gender: 'female', side: 'paternal' },
  { value: 'maternal_grandfather', label: 'Grandfather (Maternal)', description: "Mother's father", emoji: '👴', category: 'grandparent', gender: 'male', side: 'maternal' },
  { value: 'maternal_grandmother', label: 'Grandmother (Maternal)', description: "Mother's mother", emoji: '👵', category: 'grandparent', gender: 'female', side: 'maternal' },

  // ══════════ GRANDCHILDREN ══════════
  { value: 'grandson', label: 'Grandson', description: "Son's or daughter's son", emoji: '👦', category: 'grandchild', gender: 'male' },
  { value: 'granddaughter', label: 'Granddaughter', description: "Son's or daughter's daughter", emoji: '👧', category: 'grandchild', gender: 'female' },

  // ══════════ UNCLES & AUNTS (PATERNAL) ══════════
  { value: 'paternal_uncle_elder', label: 'Uncle (Father\'s elder brother)', description: "Father's elder brother", emoji: '👨', category: 'uncle_aunt', gender: 'male', side: 'paternal' },
  { value: 'paternal_uncle_younger', label: 'Uncle (Father\'s younger brother)', description: "Father's younger brother", emoji: '👨', category: 'uncle_aunt', gender: 'male', side: 'paternal' },
  { value: 'paternal_aunt', label: 'Aunt (Father\'s sister)', description: "Father's sister", emoji: '👩', category: 'uncle_aunt', gender: 'female', side: 'paternal' },
  { value: 'paternal_aunt_by_marriage', label: 'Aunt (Uncle\'s wife - paternal)', description: "Father's brother's wife", emoji: '👩', category: 'uncle_aunt', gender: 'female', side: 'paternal' },
  { value: 'paternal_uncle_by_marriage', label: 'Uncle (Aunt\'s husband - paternal)', description: "Father's sister's husband", emoji: '👨', category: 'uncle_aunt', gender: 'male', side: 'paternal' },

  // ══════════ UNCLES & AUNTS (MATERNAL) ══════════
  { value: 'maternal_uncle', label: 'Uncle (Mother\'s brother)', description: "Mother's brother", emoji: '👨', category: 'uncle_aunt', gender: 'male', side: 'maternal' },
  { value: 'maternal_aunt', label: 'Aunt (Mother\'s sister)', description: "Mother's sister", emoji: '👩', category: 'uncle_aunt', gender: 'female', side: 'maternal' },
  { value: 'maternal_aunt_by_marriage', label: 'Aunt (Uncle\'s wife - maternal)', description: "Mother's brother's wife", emoji: '👩', category: 'uncle_aunt', gender: 'female', side: 'maternal' },
  { value: 'maternal_uncle_by_marriage', label: 'Uncle (Aunt\'s husband - maternal)', description: "Mother's sister's husband", emoji: '👨', category: 'uncle_aunt', gender: 'male', side: 'maternal' },

  // ══════════ COUSINS ══════════
  { value: 'cousin_male', label: 'Cousin (Male)', description: "Uncle's or aunt's son", emoji: '👦', category: 'cousin', gender: 'male' },
  { value: 'cousin_female', label: 'Cousin (Female)', description: "Uncle's or aunt's daughter", emoji: '👧', category: 'cousin', gender: 'female' },

  // ══════════ IN-LAWS ══════════
  { value: 'father_in_law', label: 'Father-in-law', description: "Spouse's father", emoji: '👴', category: 'in_law', gender: 'male' },
  { value: 'mother_in_law', label: 'Mother-in-law', description: "Spouse's mother", emoji: '👵', category: 'in_law', gender: 'female' },
  { value: 'son_in_law', label: 'Son-in-law', description: "Daughter's husband", emoji: '👨', category: 'in_law', gender: 'male' },
  { value: 'daughter_in_law', label: 'Daughter-in-law', description: "Son's wife", emoji: '👩', category: 'in_law', gender: 'female' },
  { value: 'brother_in_law', label: 'Brother-in-law', description: "Spouse's brother or sibling's husband", emoji: '👨', category: 'in_law', gender: 'male' },
  { value: 'sister_in_law', label: 'Sister-in-law', description: "Spouse's sister or sibling's wife", emoji: '👩', category: 'in_law', gender: 'female' },

  // ══════════ NIECES & NEPHEWS ══════════
  { value: 'nephew', label: 'Nephew', description: "Sibling's son", emoji: '👦', category: 'niece_nephew', gender: 'male' },
  { value: 'niece', label: 'Niece', description: "Sibling's daughter", emoji: '👧', category: 'niece_nephew', gender: 'female' },

  // ══════════ EXTENDED FAMILY ══════════
  { value: 'great_grandfather', label: 'Great-grandfather', description: "Grandparent's father", emoji: '👴', category: 'extended', gender: 'male' },
  { value: 'great_grandmother', label: 'Great-grandmother', description: "Grandparent's mother", emoji: '👵', category: 'extended', gender: 'female' },
  { value: 'great_grandson', label: 'Great-grandson', description: "Grandchild's son", emoji: '👦', category: 'extended', gender: 'male' },
  { value: 'great_granddaughter', label: 'Great-granddaughter', description: "Grandchild's daughter", emoji: '👧', category: 'extended', gender: 'female' },
  { value: 'step_father', label: 'Step-father', description: "Mother's husband (not biological father)", emoji: '👨', category: 'extended', gender: 'male' },
  { value: 'step_mother', label: 'Step-mother', description: "Father's wife (not biological mother)", emoji: '👩', category: 'extended', gender: 'female' },
  { value: 'step_son', label: 'Step-son', description: "Spouse's son from previous marriage", emoji: '👦', category: 'extended', gender: 'male' },
  { value: 'step_daughter', label: 'Step-daughter', description: "Spouse's daughter from previous marriage", emoji: '👧', category: 'extended', gender: 'female' },
  { value: 'half_brother', label: 'Half-brother', description: "Brother with one common parent", emoji: '👦', category: 'extended', gender: 'male' },
  { value: 'half_sister', label: 'Half-sister', description: "Sister with one common parent", emoji: '👧', category: 'extended', gender: 'female' },
  { value: 'adopted_son', label: 'Adopted Son', description: "Legally adopted male child", emoji: '👦', category: 'extended', gender: 'male' },
  { value: 'adopted_daughter', label: 'Adopted Daughter', description: "Legally adopted female child", emoji: '👧', category: 'extended', gender: 'female' },
];

/**
 * Get relationship options grouped by category
 */
export function getRelationshipsByCategory(): Record<RelationshipCategory, RelationshipOption[]> {
  const grouped: Record<RelationshipCategory, RelationshipOption[]> = {
    immediate: [],
    grandparent: [],
    grandchild: [],
    uncle_aunt: [],
    cousin: [],
    in_law: [],
    niece_nephew: [],
    extended: [],
  };

  RELATIONSHIP_OPTIONS.forEach(opt => {
    grouped[opt.category].push(opt);
  });

  return grouped;
}

/**
 * Category display names
 */
export const CATEGORY_LABELS: Record<RelationshipCategory, string> = {
  immediate: 'Immediate Family',
  grandparent: 'Grandparents',
  grandchild: 'Grandchildren',
  uncle_aunt: 'Uncles & Aunts',
  cousin: 'Cousins',
  in_law: 'In-Laws',
  niece_nephew: 'Nieces & Nephews',
  extended: 'Extended Family',
};

// ═══════════════════════════════════════════════════════════
// BASIC RELATIONSHIP MAPPING (for tree structure)
// Maps detailed relationship to basic type
// ═══════════════════════════════════════════════════════════

export type BasicRelationType = 'parent' | 'child' | 'spouse' | 'sibling';

export function getBasicRelationType(relationValue: string): BasicRelationType | null {
  // If already a basic type, return it directly
  if (relationValue === 'parent' || relationValue === 'child' ||
    relationValue === 'spouse' || relationValue === 'sibling') {
    return relationValue as BasicRelationType;
  }

  const PARENT_TYPES = [
    'father', 'mother',
    'paternal_grandfather', 'paternal_grandmother', 'maternal_grandfather', 'maternal_grandmother',
    'great_grandfather', 'great_grandmother',
    'step_father', 'step_mother',
    'grandparent', // Include grandparent as parent type for tree structure
  ];

  const CHILD_TYPES = [
    'son', 'daughter',
    'grandson', 'granddaughter',
    'great_grandson', 'great_granddaughter',
    'step_son', 'step_daughter',
    'adopted_son', 'adopted_daughter',
    'nephew', 'niece',
    'grandchild', // Include grandchild as child type
  ];

  const SPOUSE_TYPES = ['husband', 'wife'];

  const SIBLING_TYPES = [
    'brother', 'sister',
    'half_brother', 'half_sister',
    'cousin_male', 'cousin_female',
    'brother_in_law', 'sister_in_law',
    'cousin', // Include generic cousin
  ];

  if (PARENT_TYPES.includes(relationValue)) return 'parent';
  if (CHILD_TYPES.includes(relationValue)) return 'child';
  if (SPOUSE_TYPES.includes(relationValue)) return 'spouse';
  if (SIBLING_TYPES.includes(relationValue)) return 'sibling';

  return null;
}

/**
 * Get the reverse relationship type for bidirectional linking.
 * If I am someone's 'parent', they are my 'child' and vice versa.
 */
export function getReverseRelationType(basicType: BasicRelationType): BasicRelationType {
  switch (basicType) {
    case 'parent': return 'child';
    case 'child': return 'parent';
    case 'spouse': return 'spouse';
    case 'sibling': return 'sibling';
    default: return 'sibling'; // Fallback
  }
}

/**
 * Get the display label for a relationship value
 */
export function getRelationshipLabel(value: string): string {
  const option = RELATIONSHIP_OPTIONS.find(o => o.value === value);
  return option?.label || value;
}

// ═══════════════════════════════════════════════════════════
// INDIAN KINSHIP TERMS (For relationship resolver)
// ═══════════════════════════════════════════════════════════

export interface IndianRelationship {
  english: string;
  hindi: string;
  hindiScript: string;
  description: string;
  gender: Gender | 'both';
  side?: 'paternal' | 'maternal' | 'both';
}

/**
 * Complete Indian kinship terminology
 * Based on Sudanese (descriptive) kinship system used in North India
 */
export const INDIAN_KINSHIP: Record<string, IndianRelationship> = {
  // Self & Spouse
  self: { english: 'Self', hindi: 'Main', hindiScript: 'मैं', description: 'You', gender: 'both' },
  husband: { english: 'Husband', hindi: 'Pati', hindiScript: 'पति', description: 'Spouse (male)', gender: 'male' },
  wife: { english: 'Wife', hindi: 'Patni', hindiScript: 'पत्नी', description: 'Spouse (female)', gender: 'female' },

  // Parents
  father: { english: 'Father', hindi: 'Pita', hindiScript: 'पिता', description: 'Father', gender: 'male' },
  mother: { english: 'Mother', hindi: 'Mata', hindiScript: 'माता', description: 'Mother', gender: 'female' },

  // Grandparents - Paternal
  paternal_grandfather: { english: 'Grandfather', hindi: 'Dada', hindiScript: 'दादा', description: "Father's father", gender: 'male', side: 'paternal' },
  paternal_grandmother: { english: 'Grandmother', hindi: 'Dadi', hindiScript: 'दादी', description: "Father's mother", gender: 'female', side: 'paternal' },

  // Grandparents - Maternal
  maternal_grandfather: { english: 'Grandfather', hindi: 'Nana', hindiScript: 'नाना', description: "Mother's father", gender: 'male', side: 'maternal' },
  maternal_grandmother: { english: 'Grandmother', hindi: 'Nani', hindiScript: 'नानी', description: "Mother's mother", gender: 'female', side: 'maternal' },

  // Siblings
  elder_brother: { english: 'Elder Brother', hindi: 'Bhaiya', hindiScript: 'भैया', description: 'Older brother', gender: 'male' },
  younger_brother: { english: 'Younger Brother', hindi: 'Bhai', hindiScript: 'छोटा भाई', description: 'Younger brother', gender: 'male' },
  elder_sister: { english: 'Elder Sister', hindi: 'Didi', hindiScript: 'दीदी', description: 'Older sister', gender: 'female' },
  younger_sister: { english: 'Younger Sister', hindi: 'Behen', hindiScript: 'छोटी बहन', description: 'Younger sister', gender: 'female' },

  // Children
  son: { english: 'Son', hindi: 'Beta', hindiScript: 'बेटा', description: 'Son', gender: 'male' },
  daughter: { english: 'Daughter', hindi: 'Beti', hindiScript: 'बेटी', description: 'Daughter', gender: 'female' },

  // Grandchildren
  grandson: { english: 'Grandson', hindi: 'Pota', hindiScript: 'पोता', description: "Son's son / Daughter's son", gender: 'male' },
  granddaughter: { english: 'Granddaughter', hindi: 'Poti', hindiScript: 'पोती', description: "Son's daughter / Daughter's daughter", gender: 'female' },

  // Paternal Uncles & Aunts
  paternal_uncle_elder: { english: 'Uncle', hindi: 'Tau', hindiScript: 'ताऊ', description: "Father's elder brother", gender: 'male', side: 'paternal' },
  paternal_uncle_younger: { english: 'Uncle', hindi: 'Chacha', hindiScript: 'चाचा', description: "Father's younger brother", gender: 'male', side: 'paternal' },
  paternal_aunt_elder_wife: { english: 'Aunt', hindi: 'Tai', hindiScript: 'ताई', description: "Tau's wife", gender: 'female', side: 'paternal' },
  paternal_aunt_younger_wife: { english: 'Aunt', hindi: 'Chachi', hindiScript: 'चाची', description: "Chacha's wife", gender: 'female', side: 'paternal' },
  paternal_aunt: { english: 'Aunt', hindi: 'Bua', hindiScript: 'बुआ', description: "Father's sister", gender: 'female', side: 'paternal' },
  paternal_aunt_husband: { english: 'Uncle', hindi: 'Fufa', hindiScript: 'फूफा', description: "Bua's husband", gender: 'male', side: 'paternal' },

  // Maternal Uncles & Aunts
  maternal_uncle: { english: 'Uncle', hindi: 'Mama', hindiScript: 'मामा', description: "Mother's brother", gender: 'male', side: 'maternal' },
  maternal_uncle_wife: { english: 'Aunt', hindi: 'Mami', hindiScript: 'मामी', description: "Mama's wife", gender: 'female', side: 'maternal' },
  maternal_aunt: { english: 'Aunt', hindi: 'Mausi', hindiScript: 'मौसी', description: "Mother's sister", gender: 'female', side: 'maternal' },
  maternal_aunt_husband: { english: 'Uncle', hindi: 'Mausa', hindiScript: 'मौसा', description: "Mausi's husband", gender: 'male', side: 'maternal' },

  // Cousins
  cousin_paternal_male: { english: 'Cousin', hindi: 'Chachera Bhai', hindiScript: 'चचेरा भाई', description: "Paternal uncle's son", gender: 'male', side: 'paternal' },
  cousin_paternal_female: { english: 'Cousin', hindi: 'Chacheri Behen', hindiScript: 'चचेरी बहन', description: "Paternal uncle's daughter", gender: 'female', side: 'paternal' },
  cousin_maternal_male: { english: 'Cousin', hindi: 'Mamera Bhai', hindiScript: 'ममेरा भाई', description: "Maternal uncle's son", gender: 'male', side: 'maternal' },
  cousin_maternal_female: { english: 'Cousin', hindi: 'Mameri Behen', hindiScript: 'ममेरी बहन', description: "Maternal uncle's daughter", gender: 'female', side: 'maternal' },

  // In-Laws (Spouse's Family)
  father_in_law: { english: 'Father-in-law', hindi: 'Sasur', hindiScript: 'ससुर', description: "Spouse's father", gender: 'male' },
  mother_in_law: { english: 'Mother-in-law', hindi: 'Saas', hindiScript: 'सास', description: "Spouse's mother", gender: 'female' },

  // Spouse's Siblings
  husband_elder_brother: { english: 'Brother-in-law', hindi: 'Jeth', hindiScript: 'जेठ', description: "Husband's elder brother", gender: 'male' },
  husband_younger_brother: { english: 'Brother-in-law', hindi: 'Devar', hindiScript: 'देवर', description: "Husband's younger brother", gender: 'male' },
  husband_sister: { english: 'Sister-in-law', hindi: 'Nanad', hindiScript: 'ननद', description: "Husband's sister", gender: 'female' },
  wife_brother: { english: 'Brother-in-law', hindi: 'Sala', hindiScript: 'साला', description: "Wife's brother", gender: 'male' },
  wife_sister: { english: 'Sister-in-law', hindi: 'Sali', hindiScript: 'साली', description: "Wife's sister", gender: 'female' },

  // Sibling's Spouses
  brother_wife: { english: 'Sister-in-law', hindi: 'Bhabhi', hindiScript: 'भाभी', description: "Brother's wife", gender: 'female' },
  sister_husband: { english: 'Brother-in-law', hindi: 'Jija', hindiScript: 'जीजा', description: "Sister's husband", gender: 'male' },

  // Children's Spouses
  son_wife: { english: 'Daughter-in-law', hindi: 'Bahu', hindiScript: 'बहू', description: "Son's wife", gender: 'female' },
  daughter_husband: { english: 'Son-in-law', hindi: 'Damad', hindiScript: 'दामाद', description: "Daughter's husband", gender: 'male' },

  // Nephew/Niece
  brother_son: { english: 'Nephew', hindi: 'Bhatija', hindiScript: 'भतीजा', description: "Brother's son", gender: 'male' },
  brother_daughter: { english: 'Niece', hindi: 'Bhatiji', hindiScript: 'भतीजी', description: "Brother's daughter", gender: 'female' },
  sister_son: { english: 'Nephew', hindi: 'Bhanja', hindiScript: 'भांजा', description: "Sister's son", gender: 'male' },
  sister_daughter: { english: 'Niece', hindi: 'Bhanji', hindiScript: 'भांजी', description: "Sister's daughter", gender: 'female' },
};

// ═══════════════════════════════════════════════════════════
// VIEW STATE
// ═══════════════════════════════════════════════════════════

export interface TreeViewState {
  scale: number;
  translateX: number;
  translateY: number;
  focusedNodeId: string | null;
}

export interface AddMemberForm {
  firstName: string;
  lastName: string;
  maidenName: string;
  gender: Gender;
  isAlive: boolean;
  birthDate: string;
  deathDate: string;
  birthPlace: string;
  currentCity: string;
  occupation: string;
  bio: string;
  photoUri: string;

  // Relationships to existing members
  relationships: {
    memberId: string;
    relationType: string; // Uses values from RELATIONSHIP_OPTIONS
    subType: RelationshipType;
  }[];
}
