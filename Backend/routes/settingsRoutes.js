import express from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', settingsController.getMaintenance);
router.put('/maintenance', requireAuth, requireAdmin, settingsController.setMaintenance);

export default router;