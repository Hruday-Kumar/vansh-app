/**
 * 🪷 MEMBER CONTROLLER
 */

import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../middleware/error-handler';

/**
 * Map detailed relationship types to base types that the database ENUM accepts.
 * The detailed type is stored in relationship_subtype column.
 */
const RELATIONSHIP_TYPE_MAP: Record<string, string> = {
  // Parent types
  father: 'parent',
  mother: 'parent',
  step_father: 'parent',
  step_mother: 'parent',
  
  // Child types  
  son: 'child',
  daughter: 'child',
  step_son: 'child',
  step_daughter: 'child',
  adopted_son: 'child',
  adopted_daughter: 'child',
  
  // Spouse types
  husband: 'spouse',
  wife: 'spouse',
  
  // Sibling types
  brother: 'sibling',
  sister: 'sibling',
  half_brother: 'sibling',
  half_sister: 'sibling',
  
  // Grandparent types
  paternal_grandfather: 'grandparent',
  paternal_grandmother: 'grandparent',
  maternal_grandfather: 'grandparent',
  maternal_grandmother: 'grandparent',
  great_grandfather: 'grandparent',
  great_grandmother: 'grandparent',
  
  // Grandchild types
  grandson: 'grandchild',
  granddaughter: 'grandchild',
  great_grandson: 'grandchild',
  great_granddaughter: 'grandchild',
  
  // Uncle/Aunt types
  paternal_uncle_elder: 'uncle',
  paternal_uncle_younger: 'uncle',
  paternal_uncle_by_marriage: 'uncle',
  maternal_uncle: 'uncle',
  maternal_uncle_by_marriage: 'uncle',
  paternal_aunt: 'aunt',
  paternal_aunt_by_marriage: 'aunt',
  maternal_aunt: 'aunt',
  maternal_aunt_by_marriage: 'aunt',
  
  // Nephew/Niece types
  nephew: 'nephew',
  niece: 'niece',
  
  // Cousin types
  cousin_male: 'cousin',
  cousin_female: 'cousin',
  
  // In-law types
  father_in_law: 'in_law',
  mother_in_law: 'in_law',
  son_in_law: 'in_law',
  daughter_in_law: 'in_law',
  brother_in_law: 'in_law',
  sister_in_law: 'in_law',
};

/**
 * Get the base relationship type for database storage
 */
function getBaseRelationshipType(detailedType: string): string {
  return RELATIONSHIP_TYPE_MAP[detailedType] || detailedType;
}

export class MemberController {
  /**
   * Get all family members
   */
  getMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Disable caching to ensure fresh relationship data
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { search, isAlive } = req.query;
      
      let query = 'SELECT * FROM members WHERE family_id = ?';
      const values: any[] = [req.user.familyId];
      
      if (search) {
        query += ' AND (first_name LIKE ? OR last_name LIKE ? OR bio LIKE ?)';
        values.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (isAlive !== undefined) {
        query += ' AND is_alive = ?';
        values.push(isAlive === 'true');
      }
      
      query += ' ORDER BY birth_date ASC';
      
      const [members] = await pool.query(query, values) as any[];
      
      // Get all relationships for this family
      const [relationships] = await pool.query(`
        SELECT r.*, 
          m1.first_name as from_first, m1.last_name as from_last,
          m2.first_name as to_first, m2.last_name as to_last
        FROM relationships r
        LEFT JOIN members m1 ON r.from_member_id = m1.id
        LEFT JOIN members m2 ON r.to_member_id = m2.id
        WHERE r.family_id = ?
      `, [req.user.familyId]) as any[];
      
      // Map relationships by member
      const relationshipsByMember = new Map<string, any[]>();
      
      relationships.forEach((r: any) => {
        // Add to from_member's relationships
        if (!relationshipsByMember.has(r.from_member_id)) {
          relationshipsByMember.set(r.from_member_id, []);
        }
        relationshipsByMember.get(r.from_member_id)!.push({
          id: r.id,
          type: r.relationship_type,
          subtype: r.relationship_subtype,
          memberId: r.to_member_id,
          memberName: `${r.to_first} ${r.to_last}`,
          marriageDate: r.marriage_date,
          prana: { strength: r.prana_strength || 0.5 }
        });
        console.log(`🔗 [Rel] ${r.from_first} gets type='${r.relationship_type}' → ${r.to_first}`);
        
        // Add reverse relationship to to_member
        if (!relationshipsByMember.has(r.to_member_id)) {
          relationshipsByMember.set(r.to_member_id, []);
        }
        const reverseType = this.getReverseRelationshipType(r.relationship_type);
        console.log(`🔗 [Rel] ${r.to_first} gets type='${reverseType}' (reversed) → ${r.from_first}`);
        relationshipsByMember.get(r.to_member_id)!.push({
          id: r.id,
          type: reverseType,
          subtype: r.relationship_subtype,
          memberId: r.from_member_id,
          memberName: `${r.from_first} ${r.from_last}`,
          marriageDate: r.marriage_date,
          prana: { strength: r.prana_strength || 0.5 }
        });
      });
      
      // Attach relationships to members
      const membersWithRelationships = members.map((m: any) => ({
        ...this.formatMember(m),
        relationships: relationshipsByMember.get(m.id) || []
      }));
      
      // DEBUG: Log final Ramakrishna's relationships
      const ramakrishna = membersWithRelationships.find((m: any) => m.firstName === 'Ramakrishna');
      if (ramakrishna) {
        console.log('📤 [Response] Ramakrishna relationships:', JSON.stringify(ramakrishna.relationships));
      }
      
      res.json({
        success: true,
        data: membersWithRelationships
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get single member
   */
  getMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memberId } = req.params;
      
      const [members] = await pool.query(
        'SELECT * FROM members WHERE id = ? AND family_id = ?',
        [memberId, req.user.familyId]
      ) as any[];
      
      if (members.length === 0) {
        throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
      }
      
      // Get relationships
      const [relationships] = await pool.query(`
        SELECT r.*, 
          m1.first_name as from_first, m1.last_name as from_last,
          m2.first_name as to_first, m2.last_name as to_last
        FROM relationships r
        LEFT JOIN members m1 ON r.from_member_id = m1.id
        LEFT JOIN members m2 ON r.to_member_id = m2.id
        WHERE r.from_member_id = ? OR r.to_member_id = ?
      `, [memberId, memberId]) as any[];
      
      const memberData = this.formatMember(members[0]);
      const member = {
        ...memberData,
        relationships: relationships.map((r: any) => ({
          id: r.id,
          type: r.relationship_type,
          fromMemberId: r.from_member_id,
          fromMemberName: `${r.from_first} ${r.from_last}`,
          toMemberId: r.to_member_id,
          toMemberName: `${r.to_first} ${r.to_last}`,
          marriageDate: r.marriage_date,
          pranaStrength: r.prana_strength
        }))
      };
      
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Create new member
   */
  createMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const {
        firstName, lastName, maidenName, nickname, gender,
        birthDate, birthPlace, deathDate, isAlive,
        bio, occupation, education, currentCity,
        contactEmail, contactPhone
      } = req.body;
      
      if (!firstName || !lastName || !gender) {
        throw new AppError('First name, last name, and gender are required', 400, 'MISSING_FIELDS');
      }
      
      const memberId = uuidv4();
      await pool.query(`
        INSERT INTO members (
          id, family_id, first_name, last_name, maiden_name, nickname, gender,
          birth_date, birth_place, death_date, is_alive,
          bio, occupation, current_city,
          contact_email, contact_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        memberId, req.user.familyId,
        firstName, lastName, maidenName || null,
        nickname || null, gender,
        birthDate || null, birthPlace || null,
        deathDate || null, isAlive !== false,
        bio || null, occupation || null, currentCity || null,
        contactEmail || null, contactPhone || null
      ]);
      
      // Insert self-reference in closure table
      await pool.query(`
        INSERT INTO member_closure (ancestor_id, descendant_id, depth, path)
        VALUES (?, ?, 0, ?)
      `, [memberId, memberId, JSON.stringify([memberId])]);
      
      res.status(201).json({
        success: true,
        data: { id: memberId, firstName, lastName }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Update member
   */
  updateMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memberId } = req.params;
      const updates = req.body;
      
      // Map camelCase to snake_case
      const fieldMap: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'last_name',
        maidenName: 'maiden_name',
        birthDate: 'birth_date',
        birthPlace: 'birth_place',
        deathDate: 'death_date',
        isAlive: 'is_alive',
        avatarUri: 'avatar_uri',
        currentCity: 'current_city',
        contactEmail: 'contact_email',
        contactPhone: 'contact_phone',
        allowDigitalEcho: 'allow_digital_echo'
      };
      
      const setClauses: string[] = [];
      const values: any[] = [];
      
      for (const [key, value] of Object.entries(updates)) {
        const dbKey = fieldMap[key] || key;
        setClauses.push(`${dbKey} = ?`);
        values.push(Array.isArray(value) ? JSON.stringify(value) : value);
      }
      
      if (setClauses.length === 0) {
        throw new AppError('No fields to update', 400, 'NO_UPDATES');
      }
      
      values.push(memberId, req.user.familyId);
      await pool.query(
        `UPDATE members SET ${setClauses.join(', ')} WHERE id = ? AND family_id = ?`,
        values
      );
      
      res.json({ success: true, message: 'Member updated' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Delete member
   */
  deleteMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memberId } = req.params;
      
      // Don't allow deleting yourself
      if (memberId === req.user.memberId) {
        throw new AppError('Cannot delete yourself', 400, 'CANNOT_DELETE_SELF');
      }
      
      await pool.query(
        'DELETE FROM members WHERE id = ? AND family_id = ?',
        [memberId, req.user.familyId]
      );
      
      res.json({ success: true, message: 'Member deleted' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Upload member avatar
   */
  uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      if (!req.file) {
        throw new AppError('No file uploaded', 400, 'NO_FILE');
      }
      
      const { memberId } = req.params;
      const avatarUri = `/uploads/avatars/${req.file.filename}`;
      
      await pool.query(
        'UPDATE members SET avatar_uri = ? WHERE id = ? AND family_id = ?',
        [avatarUri, memberId, req.user.familyId]
      );
      
      res.json({ success: true, data: { avatarUri } });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get member relationships
   */
  getRelationships = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memberId } = req.params;
      
      const [relationships] = await pool.query(`
        SELECT r.*, 
          m1.first_name as from_first, m1.last_name as from_last, m1.avatar_uri as from_avatar,
          m2.first_name as to_first, m2.last_name as to_last, m2.avatar_uri as to_avatar
        FROM relationships r
        LEFT JOIN members m1 ON r.from_member_id = m1.id
        LEFT JOIN members m2 ON r.to_member_id = m2.id
        WHERE (r.from_member_id = ? OR r.to_member_id = ?) AND r.family_id = ?
      `, [memberId, memberId, req.user.familyId]) as any[];
      
      res.json({
        success: true,
        data: relationships.map((r: any) => {
          // Determine if we need to reverse the type based on which member is requesting
          // If memberId is the toMember (e.g., child), then reverse the type
          const isFromMember = r.from_member_id === memberId;
          const effectiveType = isFromMember 
            ? r.relationship_type  // Keep original: "I am the parent"
            : this.getReverseRelationshipType(r.relationship_type);  // Reverse: "They are my parent → I am their child"
          
          return {
            id: r.id,
            type: effectiveType,
            fromMember: {
              id: r.from_member_id,
              name: `${r.from_first} ${r.from_last}`,
              avatarUri: r.from_avatar
            },
            toMember: {
              id: r.to_member_id,
              name: `${r.to_first} ${r.to_last}`,
              avatarUri: r.to_avatar
            },
            marriageDate: r.marriage_date,
            pranaStrength: parseFloat(r.prana_strength)
          };
        })
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Add relationship
   */
  addRelationship = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memberId } = req.params;
      const { toMemberId, relationshipType, marriageDate } = req.body;
      
      if (!toMemberId || !relationshipType) {
        throw new AppError('Target member and relationship type are required', 400, 'MISSING_FIELDS');
      }
      
      // Map detailed type (father, mother, son, etc.) to base type (parent, child, etc.)
      const baseType = getBaseRelationshipType(relationshipType);
      // Store detailed type as subtype if it differs from base type
      const subtype = baseType !== relationshipType ? relationshipType : null;
      
      console.log(`[AddRelationship] Creating: ${relationshipType} -> baseType: ${baseType}, subtype: ${subtype}`);
      
      const relationshipId = uuidv4();
      await pool.query(`
        INSERT INTO relationships (id, family_id, from_member_id, to_member_id, relationship_type, relationship_subtype, marriage_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        relationshipId, req.user.familyId,
        memberId, toMemberId, baseType, subtype,
        marriageDate || null
      ]);
      
      // If parent relationship, update closure table
      if (baseType === 'parent') {
        await this.updateClosureTable(memberId, toMemberId);
      }
      
      res.status(201).json({
        success: true,
        data: { id: relationshipId }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Remove relationship
   */
  removeRelationship = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { relationshipId } = req.params;
      
      await pool.query(
        'DELETE FROM relationships WHERE id = ? AND family_id = ?',
        [relationshipId, req.user.familyId]
      );
      
      res.json({ success: true, message: 'Relationship removed' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get ancestors
   */
  getAncestors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memberId } = req.params;
      const { maxDepth } = req.query;
      
      let query = `
        SELECT m.*, mc.depth, mc.branch
        FROM member_closure mc
        JOIN members m ON mc.ancestor_id = m.id
        WHERE mc.descendant_id = ? AND mc.depth > 0
      `;
      const values: any[] = [memberId];
      
      if (maxDepth) {
        query += ' AND mc.depth <= ?';
        values.push(parseInt(maxDepth as string));
      }
      
      query += ' ORDER BY mc.depth ASC';
      
      const [ancestors] = await pool.query(query, values) as any[];
      
      res.json({
        success: true,
        data: ancestors.map((a: any) => ({
          ...this.formatMember(a),
          depth: a.depth,
          branch: a.branch
        }))
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get descendants
   */
  getDescendants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memberId } = req.params;
      const { maxDepth } = req.query;
      
      let query = `
        SELECT m.*, mc.depth, mc.branch
        FROM member_closure mc
        JOIN members m ON mc.descendant_id = m.id
        WHERE mc.ancestor_id = ? AND mc.depth > 0
      `;
      const values: any[] = [memberId];
      
      if (maxDepth) {
        query += ' AND mc.depth <= ?';
        values.push(parseInt(maxDepth as string));
      }
      
      query += ' ORDER BY mc.depth ASC';
      
      const [descendants] = await pool.query(query, values) as any[];
      
      res.json({
        success: true,
        data: descendants.map((d: any) => ({
          ...this.formatMember(d),
          depth: d.depth,
          branch: d.branch
        }))
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get full family tree
   */
  getFamilyTree = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      // Get all members
      const [members] = await pool.query(
        'SELECT * FROM members WHERE family_id = ? ORDER BY birth_date ASC',
        [req.user.familyId]
      ) as any[];
      
      // Get all relationships
      const [relationships] = await pool.query(
        'SELECT * FROM relationships WHERE family_id = ?',
        [req.user.familyId]
      ) as any[];
      
      res.json({
        success: true,
        data: {
          members: members.map(this.formatMember),
          relationships: relationships.map((r: any) => ({
            id: r.id,
            type: r.relationship_type,
            fromMemberId: r.from_member_id,
            toMemberId: r.to_member_id,
            marriageDate: r.marriage_date,
            pranaStrength: parseFloat(r.prana_strength)
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  // Helper to format member data
  private formatMember = (m: any) => ({
    id: m.id,
    firstName: m.first_name,
    lastName: m.last_name,
    maidenName: m.maiden_name,
    nickname: m.nickname || null,
    nicknames: m.nickname ? [m.nickname] : [],
    gender: m.gender,
    birthDate: m.birth_date,
    birthPlace: m.birth_place,
    deathDate: m.death_date,
    isAlive: m.is_alive,
    avatarUri: m.avatar_uri,
    bio: m.bio,
    occupation: m.occupation,
    currentCity: m.current_city,
    hasVoiceSamples: m.has_voice_samples,
    allowDigitalEcho: m.allow_digital_echo,
    contactEmail: m.contact_email,
    contactPhone: m.contact_phone,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    relationships: []
  });
  
  // Get reverse relationship type
  private getReverseRelationshipType = (type: string): string => {
    const reverseMap: Record<string, string> = {
      'parent': 'child',
      'child': 'parent',
      'spouse': 'spouse',
      'sibling': 'sibling',
      'grandparent': 'grandchild',
      'grandchild': 'grandparent',
      'uncle': 'nephew',
      'aunt': 'niece',
      'nephew': 'uncle',
      'niece': 'aunt',
      'cousin': 'cousin',
      'in_law': 'in_law',
      'other': 'other'
    };
    return reverseMap[type] || 'other';
  };
  
  // Update closure table for ancestry
  private updateClosureTable = async (parentId: string, childId: string) => {
    // Add all ancestors of parent as ancestors of child
    await pool.query(`
      INSERT INTO member_closure (ancestor_id, descendant_id, depth, path)
      SELECT mc.ancestor_id, ?, mc.depth + 1, JSON_ARRAY_APPEND(mc.path, '$', ?)
      FROM member_closure mc
      WHERE mc.descendant_id = ?
      ON DUPLICATE KEY UPDATE depth = LEAST(member_closure.depth, VALUES(depth))
    `, [childId, childId, parentId]);
  };
}
