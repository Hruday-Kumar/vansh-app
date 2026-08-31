/**
 * 🪷 EVENT ROUTES (Family Album Folders)
 */

import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = Router();
const controller = new EventController();

// All routes require authentication
router.use(authenticate);

// ─── Event CRUD ──────────────────────────────────────────────────────────────
router.get('/', controller.getEvents);
router.get('/:eventId', controller.getEvent);
router.post('/', controller.createEvent);
router.put('/:eventId', controller.updateEvent);
router.delete('/:eventId', controller.deleteEvent);

// ─── Event Memories ──────────────────────────────────────────────────────────
router.get('/:eventId/memories', controller.getEventMemories);
router.post('/:eventId/memories', controller.addMemoriesToEvent);
router.post('/:eventId/upload', uploadMultiple, controller.uploadToEvent);
router.delete('/:eventId/memories/:memoryId', controller.removeMemoryFromEvent);

export default router;
