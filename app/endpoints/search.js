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
exports.handler = function search(req, res, next) {
  res.send('search')
  next()
}
