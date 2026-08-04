import * as settingsService from '../services/settingsService.js';

export const getMaintenance = async (req, res) => {
  try { res.json({ maintenance_mode: await settingsService.getMaintenanceStatus() }); } 
  catch (err) { res.status(500).json({ error: 'Failed to fetch settings' }); }
};

export const setMaintenance = async (req, res) => {
  try {
    const isEnabled = req.body.isEnabled;
    await settingsService.updateMaintenanceStatus(isEnabled ? 'true' : 'false');
    res.json({ success: true, maintenance_mode: isEnabled });
  } catch (err) { res.status(500).json({ error: 'Failed to update settings' }); }
};