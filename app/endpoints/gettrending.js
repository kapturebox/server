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
const _ = require('lodash');

const plugins = require('../components/plugin_handler');
const filterResults = require('../components/results_filter');

exports.handler = function gettrending(req, res, next) {
  const filter = req.query.filter;
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
    .then(mergeResults)
    .then((results) => filterResults(results, filter))
    .then((results) => res.status(200).json(results))
    .catch(next)
}

// We'll get an array of results from each plugin .. this will merge it all into one
// big resultant object
function mergeResults(results) {
  return results.reduce((last, cur, idx) => {
    return _.merge(last, cur);
  }, {})
}
