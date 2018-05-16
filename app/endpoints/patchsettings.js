/**
 * Update only the settings presented in body
 *
 * PATCH: /api/v1/settings
 * 
 * body:
 *   downloadPaths {object}
 *   plugins {object}
 *   system {object}
 *   userInfo {object}
 *   
 */

exports.handler = require('../api/settings/settings.controller').patchSettings;
