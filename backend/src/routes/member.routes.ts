/**
 * 🪷 MEMBER ROUTES
 */

import { Router } from 'express';
import { MemberController } from '../controllers/member.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';

const router = Router();
const controller = new MemberController();

// All routes require authentication
router.use(authenticate);

// Fixed-path routes MUST come before parameterized routes
// (Express matches in registration order — /:memberId would capture 'tree' as an ID)
router.get('/tree/full', controller.getFamilyTree);

// Member CRUD
router.get('/', controller.getMembers);
router.get('/:memberId', controller.getMember);
router.post('/', controller.createMember);
router.put('/:memberId', controller.updateMember);
router.delete('/:memberId', requireRole('admin', 'elder'), controller.deleteMember);

// Avatar upload
router.post('/:memberId/avatar', uploadAvatar, controller.uploadAvatar);

// Relationships
router.get('/:memberId/relationships', controller.getRelationships);
router.post('/:memberId/relationships', controller.addRelationship);
router.delete('/:memberId/relationships/:relationshipId', controller.removeRelationship);

// Ancestry queries
router.get('/:memberId/ancestors', controller.getAncestors);
router.get('/:memberId/descendants', controller.getDescendants);

export default router;
