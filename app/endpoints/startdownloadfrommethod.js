/**
 * Start download based on download method
 *
 * GET: /api/v1/downloads/method:{methodId}/{slug}?where=default
 * 
 */
const plugins = require('../components/plugin_handler');

exports.handler = function startdownloadfrommethod(req, res, next) {
  const methodId = req.params.methodId;
  const slug = Buffer.from(req.params.slug, 'base64').toString('ascii');
  const where = req.query.where;

  plugins
    .getDownloadMechanismProvider(methodId)
    .downloadSlug(slug, where)
    .then((results) => res.status(200).json(results))
    .catch(next)
}
