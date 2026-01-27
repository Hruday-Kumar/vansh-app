/**
 * 🪷 VASIYAT ROUTES
 */

import { Router } from 'express';
import { VasiyatController } from '../controllers/vasiyat.controller';
import { authenticate } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = Router();
const controller = new VasiyatController();

// All routes require authentication
router.use(authenticate);

// Vasiyat CRUD
router.get('/', controller.getVasiyats);
router.get('/:vasiyatId', controller.getVasiyat);
router.post('/', uploadMultiple, controller.createVasiyat);
router.put('/:vasiyatId', controller.updateVasiyat);
router.delete('/:vasiyatId', controller.deleteVasiyat);

// Recipients
router.get('/:vasiyatId/recipients', controller.getRecipients);
router.post('/:vasiyatId/recipients', controller.addRecipient);
router.delete('/:vasiyatId/recipients/:memberId', controller.removeRecipient);

// Unlock
router.post('/:vasiyatId/unlock', controller.unlockVasiyat);
router.post('/:vasiyatId/request-unlock', controller.requestUnlock);

// Check pending (for scheduled unlocks)
router.get('/check/pending', controller.checkPendingUnlocks);

// View tracking
router.post('/:vasiyatId/view', controller.recordView);

export default router;
