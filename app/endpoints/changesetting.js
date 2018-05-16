/**
 * Change a setting
 *
 * PUT: /api/v1/settings/{key}
 * 
 */
exports.handler = function changesetting(req, res, next) {
  res.send('changesetting')
  next()
}
