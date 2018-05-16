/**
 * Get all current settings
 *
 * GET: /api/v1/settings
 * 
 */

exports.handler = require('../api/settings/settings.controller').getSettings;


// exports.handler = function getallsettings(req, res, next) {
//   res.json({'getallsettings': true});
//   next()
// }
