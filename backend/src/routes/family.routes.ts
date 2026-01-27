/**
 * 🪷 FAMILY ROUTES
 */

import { Router } from 'express';
import { FamilyController } from '../controllers/family.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const controller = new FamilyController();

// All routes require authentication
router.use(authenticate);

// Family CRUD
router.get('/', controller.getFamily);
router.post('/', controller.createFamily);
router.put('/:familyId', requireRole('admin', 'elder'), controller.updateFamily);
router.delete('/:familyId', requireRole('admin'), controller.deleteFamily);

// Family settings
router.get('/:familyId/settings', controller.getSettings);
router.put('/:familyId/settings', requireRole('admin', 'elder'), controller.updateSettings);

// Family stats
router.get('/:familyId/stats', controller.getStats);

// Traditions (Parampara)
router.get('/:familyId/traditions', controller.getTraditions);
router.post('/:familyId/traditions', controller.createTradition);
router.put('/:familyId/traditions/:traditionId', controller.updateTradition);
router.delete('/:familyId/traditions/:traditionId', requireRole('admin', 'elder'), controller.deleteTradition);

export default router;
