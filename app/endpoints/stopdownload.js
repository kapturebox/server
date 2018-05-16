/**
 * Stops the given download ID
 *
 * DELETE: /api/v1/downloads/{id}
 * 
 */
exports.handler = function stopdownload(req, res, next) {
  res.send('stopdownload')
  next()
}
