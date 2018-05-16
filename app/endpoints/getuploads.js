/**
 * Get a list of all of the uploads that have been performed
 *
 * GET: /api/v1/uploads
 * 
 */
exports.handler = function getuploads(req, res, next) {
  res.send('getuploads')
  next()
}
