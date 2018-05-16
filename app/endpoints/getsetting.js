/**
 * Get a setting
 *
 * GET: /api/v1/settings/{key}
 * 
 */
exports.handler = function getsetting(req, res, next) {
  res.send('getsetting')
  next()
}
