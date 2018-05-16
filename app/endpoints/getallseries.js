/**
 * Get all currently configured autokapture series
 *
 * GET: /api/v1/series
 * 
 */
exports.handler = function getallseries(req, res, next) {
  res.send('getallseries')
  next()
}
