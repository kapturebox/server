/**
 * Get all downloads, active and inactive
 *
 * GET: /api/v1/downloads
 * 
 * query:
 *   filter {string}
 *   
 */
exports.handler = function getalldownloads(req, res, next) {
  res.send('getalldownloads')
  next()
}
