/**
 * Search all available sources
 *
 * GET: /api/v1/search
 * 
 * query:
 *   q {string} String to query sources for.
 *   filter {string}
 *   
 */

exports.handler = require('../api/search/search.controller').search;
