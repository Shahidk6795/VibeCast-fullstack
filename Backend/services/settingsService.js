import pool from '../db.js';

export const getMaintenanceStatus = async () => {
  const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'maintenance_mode'");
  return rows.length > 0 && rows[0].setting_value === 'true';
};

export const updateMaintenanceStatus = async (valueString) => {
  await pool.query("UPDATE settings SET setting_value = ? WHERE setting_key = 'maintenance_mode'", [valueString]);
};