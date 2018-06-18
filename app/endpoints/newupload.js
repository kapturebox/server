/**
 * Uploads a new file
 *
 * POST: /api/v1/uploads?where={where}
 * 
 * formData:
 *   file {file} Binary upload data.
 *   where {string} destination where file should be placed
 *   
 */
const plugins = require('../components/plugin_handler');

// TODO: This upload module needs tests

exports.handler = function newupload(req, res, next) {
  const where = req.query.where || 'default';

  if (!req.files) {
    let err = new Error('no files were uploaded');
    err.statusCode = 400;
    return next(err);
  }

  const uploader = plugins.getPlugin('com_kapturebox_uploader');

  const uplPromises = Object.keys(req.files)
    .map((k) => uploader.uploadFile(req.files[k], where));

  Promise
    .all(uplPromises)
    .then((results) => res.status(202).send(results))
    .catch(next)
}
