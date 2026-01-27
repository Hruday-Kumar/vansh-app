/**
 * 🪷 AUTH ROUTES
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { sanitizeBody, validate, validationRules } from '../middleware/security';

const router = Router();
const controller = new AuthController();

// Apply input sanitization to all routes
router.use(sanitizeBody);

// Public routes with validation
router.post('/register', validate(validationRules.register), controller.register);
router.post('/login', validate(validationRules.login), controller.login);
router.post('/refresh', controller.refreshToken);

// Protected routes with validation
router.get('/me', authenticate, controller.getMe);
router.post('/logout', authenticate, controller.logout);
router.put('/change-password', authenticate, validate(validationRules.changePassword), controller.changePassword);

export default router;
