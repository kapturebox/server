/**
 * Start download based on download method
 *
 * GET: /api/v1/downloads/method:{methodId}/{slug}
 * 
 */
exports.handler = function startdownloadfrommethod(req, res, next) {
  res.send('startdownloadfrommethod')
  next()
}
