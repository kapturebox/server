/**
 * Get all downloads, active and inactive
 *
 * GET: /api/v1/downloads
 * 
 * query:
 *   filter {string}
 *   
 */

exports.handler = require('../api/download/download.controller').getDownloads;
