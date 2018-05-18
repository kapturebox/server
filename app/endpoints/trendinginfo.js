/**
 * Get more details about trending entry
 *
 * GET: /api/v1/trending/{sourceId}/info/{id}
 * 
 */
exports.handler = function trendinginfo(req, res, next) {
  res.send('trendinginfo')
  next()
}
