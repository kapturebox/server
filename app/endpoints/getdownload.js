/**
 * Gets the given download ID
 *
 * GET: /api/v1/downloads/{id}
 * 
 */
exports.handler = function getdownload(req, res, next) {
  res.send('getdownload')
  next()
}
