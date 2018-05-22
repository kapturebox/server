/**
 * Get currently trending media
 *
 * GET: /api/v1/trending
 * 
 * query:
 *   filter {string}
 *   
 */

const Promise = require('bluebird');
const plugins = require('../components/plugin_handler');

exports.handler = function gettrending(req, res, next) {
  var trendingResults;

  try {
    trendingResults = plugins
      .getEnabledPluginsOfType('trending')
      .map((each) => each.trending());

    if( ! trendingResults ) {
      let err = new Error('no trending plugins enabled');
      err.statusCode = 409;
      throw err;
    }
  } catch(err) {
    return next(err);
  }

  Promise.all(trendingResults)
    .then(result => res.status(200).json(result))
    .catch(next)
}
