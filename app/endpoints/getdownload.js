/**
 * Gets the given download ID
 *
 * GET: /api/v1/downloads/{id}
 * 
 */

const plugins = require('../components/plugin_handler');

exports.handler = function getdownload(req, res, next) {
  const id = req.params.id;
  const parsed = Buffer
    .from(id, 'base64')
    .toString('ascii')
    .split(':');

  const pluginId = parsed[0];
  const entryId = parsed[1];

  const results = plugins
    .getPlugin(pluginId)
    .status(entryId)

  return res.status(200).json(results)
}
