/**
 * Get details about a specific series
 *
 * GET: /api/v1/series/{sourceId}/{entryId}
 * 
 */

const plugins = require('../components/plugin_handler');

exports.handler = function getseriesinfo(req, res, next) {
  const sourceId = req.params.sourceId;
  const entryId = req.params.entryId;

  plugins
    .getPlugin(sourceId)
    .info(entryId)
    .then((results) => res.status(200).json(results))
    .catch(next);
}
