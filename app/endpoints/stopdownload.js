/**
 * Stops the given download ID
 *
 * DELETE: /api/v1/downloads/{id}?fromDisk=false
 * 
 */

const plugins = require('../components/plugin_handler');

exports.handler = function stopdownload(req, res, next) {
  const id = req.params.id;
  const fromDisk = req.params.fromDisk || false;

  const buf = Buffer
    .from(id, 'base64')
    .toString('ascii')
    .split(':');

  const downloaderId = buf[0];
  const entryId = buf[1];

  plugins
    .getPlugin(downloaderId)
    .removeDownloadId(entryId, fromDisk)
    .then((results) => res.status(200).json(results))
    .catch(next);  
}
