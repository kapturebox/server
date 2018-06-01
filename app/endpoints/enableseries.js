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
const plugins = require('../components/plugin_handler');

// TODO: this is broken still, need to redefine how we get/store the media info
// since we are changing the interface, we copy and redefine
exports.handler = function addSeriesV1(req, res, next) {
  const sourceId = req.params.sourceId;
  const entryId = req.params.entryId;

  plugins
    .getPlugin(sourceId)
    .downloadId(entryId)  //TODO: Should probably make this more consistent with slug / id paradigm
    .then((item) => res.status(200).json(item))
    .catch(next);
}
