/**
 * Start download based on download method
 *
 * GET: /api/v1/downloads/method:{methodId}/{slug}
 * 
 */
const plugins = require('../components/plugin_handler');

exports.handler = function startdownloadfrommethod(req, res, next) {
  const methodId = req.params.methodId;
  const slug = req.params.slug;

  plugins
    .getDownloadMechanismProvider(methodId)
    .downloadSlug(slug)
    .then((results) => res.status(200).json(results))
    .catch(next)
}
