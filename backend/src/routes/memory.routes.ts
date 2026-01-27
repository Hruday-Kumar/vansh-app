/**
 * 🪷 MEMORY ROUTES (Smriti)
 */

import { Router } from 'express';
import { MemoryController } from '../controllers/memory.controller';
import { authenticate } from '../middleware/auth';
import { uploadMemory, uploadMultiple } from '../middleware/upload';

const router = Router();
const controller = new MemoryController();

// All routes require authentication
router.use(authenticate);

// Memory CRUD
router.get('/', controller.getMemories);
router.get('/:memoryId', controller.getMemory);
router.post('/', uploadMemory, controller.uploadMemory);
router.post('/batch', uploadMultiple, controller.uploadMultiple);
router.put('/:memoryId', controller.updateMemory);
router.delete('/:memoryId', controller.deleteMemory);

// Tagging
router.post('/:memoryId/tags', controller.addTags);
router.delete('/:memoryId/tags/:tag', controller.removeTag);
router.post('/:memoryId/tag-members', controller.tagMembers);
router.delete('/:memoryId/tag-members/:memberId', controller.untagMember);

// Favorites
router.post('/:memoryId/favorite', controller.toggleFavorite);

// Time River view
router.get('/timeline/river', controller.getTimeRiver);

// AI Analysis
router.post('/:memoryId/analyze', controller.analyzeMemory);

export default router;
