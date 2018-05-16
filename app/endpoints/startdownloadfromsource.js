/**
 * Start download based on source configuration of entryId
 *
 * POST: /api/v1/downloads/source:{sourceId}/{slug}
 * 
 */
exports.handler = function startdownloadfromsource(req, res, next) {
  res.send('startdownloadfromsource')
  next()
}
