/**
 * Get a setting
 *
 * GET: /api/v1/settings/{key}
 * 
 */
exports.handler = require('../api/settings/settings.controller').getSetting;
