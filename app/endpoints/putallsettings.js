/**
 * Change ALL settings via body object
 *
 * PUT: /api/v1/settings
 * 
 * body:
 *   downloadPaths {object}
 *   plugins {object}
 *   system {object}
 *   userInfo {object}
 *   
 */
exports.handler = require('../api/settings/settings.controller').putSettings;
