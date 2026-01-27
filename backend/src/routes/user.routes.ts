/**
 * 🪷 USER ROUTES - User profile and settings
 */

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new UserController();

// All routes require authentication
router.use(authenticate);

// User profile
router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);

// User preferences/settings
router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);

// Account management
router.put('/change-password', controller.changePassword);
router.delete('/account', controller.deleteAccount);

export default router;
