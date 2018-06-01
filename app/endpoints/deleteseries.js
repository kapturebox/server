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
const plugins = require('../components/plugin_handler');

exports.handler = function deleteseries(req, res, next) {
  const sourceId = req.params.sourceId;
  const entryId = req.params.entryId;

  plugins
    .getPlugin(sourceId)
    .removeId(entryId)
    .then((resp) => res.status(200).json(resp))
    .catch(next);
}
