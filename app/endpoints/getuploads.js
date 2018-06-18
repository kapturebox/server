/**
 * Get a list of all of the uploads that have been performed
 *
 * GET: /api/v1/uploads
 * 
 */
const plugins = require('../components/plugin_handler');

exports.handler = function getuploads(req, res, next) {
  const uploader = plugins.getPlugin('com_kapturebox_uploader');

  uploader
    .status()
    .then((results) => res.status(200).json(results))
    .catch(next);
}
