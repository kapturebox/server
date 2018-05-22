/**
 * Get more details about trending entry
 *
 * GET: /api/v1/trending/{sourceId}/info/{id}
 * 
 */
const plugins = require('../components/plugin_handler');


exports.handler = function trendinginfo(req, res, next) {
  const sourceId = req.params.sourceId;
  const id = req.params.id;

  plugins
    .getPlugin(sourceId)
    .trendingInfo(id)
    .then((result) => res.status(200).json(result))
    .catch(next);
}
