/**
 * Get currently trending media
 *
 * GET: /api/v1/trending
 * 
 * query:
 *   filter {string}
 *   
 */
exports.handler = function gettrending(req, res, next) {
  res.send('gettrending')
  next()
}
