/**
 * Get all currently configured autokapture series
 *
 * GET: /api/v1/series
 * 
 */

exports.handler = require('../api/series/series.controller').index
