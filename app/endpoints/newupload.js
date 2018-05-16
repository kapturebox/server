/**
 * Uploads a new file
 *
 * POST: /api/v1/uploads
 * 
 * formData:
 *   file {file} Binary upload data.
 *   type {string} Type of the media being uploaded.
 *   
 */
exports.handler = function newupload(req, res, next) {
  res.send('newupload')
  next()
}
