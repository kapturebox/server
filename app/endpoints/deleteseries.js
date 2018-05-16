/**
 * Delete a series from being autokaptured
 *
 * DELETE: /api/v1/series/{sourceId}/{entryId}
 * 
 * path:
 *   sourceId {string}
 *   entryId {string}
 *   
 */
exports.handler = function deleteseries(req, res, next) {
  res.send('deleteseries')
  next()
}
