/**
 * Start download based on source configuration of entryId
 *
 * POST: /api/v1/downloads/source:{sourceId}/{entryId}
 * 
 */

const plugins = require('../components/plugin_handler');

exports.handler = function startdownloadfromsource(req, res, next) {
  const sourceId = req.params.sourceId;
  const entryId = req.params.entryId;

  plugins
    .getPlugin(sourceId)
    .downloadId(entryId)
    .then((results) => res.status(200).json(results))
    .catch(next);
}
