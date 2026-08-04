import express from 'express';
import * as settingsController from '../controllers/settingsController.js';
const router = express.Router();

router.get('/', settingsController.getMaintenance);
router.put('/maintenance', settingsController.setMaintenance);
export default router;