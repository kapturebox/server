/**
 * Get all current settings
 *
 * GET: /api/v1/settings
 * 
 */

exports.handler = require('../api/settings/settings.controller').getSettings;
