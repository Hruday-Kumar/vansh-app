/**
 * 🪷 KATHA ROUTES
 */

import { Router } from 'express';
import { KathaController } from '../controllers/katha.controller';
import { authenticate } from '../middleware/auth';
import { uploadAudio } from '../middleware/upload';

const router = Router();
const controller = new KathaController();

// All routes require authentication
router.use(authenticate);

// Katha CRUD
router.get('/', controller.getKathas);
router.get('/:kathaId', controller.getKatha);
router.post('/', uploadAudio, controller.createKatha);
router.put('/:kathaId', controller.updateKatha);
router.delete('/:kathaId', controller.deleteKatha);

// Transcription
router.post('/:kathaId/transcribe', controller.transcribeKatha);

// Link to memory (voice-photo stitching)
router.post('/:kathaId/link-memory', controller.linkToMemory);
router.delete('/:kathaId/link-memory/:memoryId', controller.unlinkFromMemory);

// Favorites
router.post('/:kathaId/favorite', controller.toggleFavorite);

// Play count
router.post('/:kathaId/play', controller.recordPlay);

export default router;
