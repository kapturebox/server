/**
 * Start a new series to be autokaptured
 *
 * POST: /api/v1/series/{sourceId}/{entryId}
 * 
 * path:
 *   sourceId {string} ID of source plugin to request entryId from.
 *   entryId {string} ID of series in question that you want added to autokapture.
 *   
 */
exports.handler = function enableseries(req, res, next) {
  res.send('enableseries')
  next()
}
