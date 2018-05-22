const Promise = require('bluebird');
const util = require('util');
const _ = require('lodash');
const request = require('request');

// TODO: put into settings
const clientId = 'fe722213d0c097ed33e320d28b3fca53edcd66b6ca118ea29bd60d908b705b88';
const sourceId = 'trakt';
const traktAdditionalInfoUrl = 'https://trakt.tv/%s/%s'  // 1: type, 2: slug



var TraktTrending = function( options ) {
  this.metadata = {
    pluginId: 'tv_trakt',                  // Unique ID of plugin
    pluginName: 'Trakt',                   // Display name of plugin
    pluginTypes: 'trending',               // 'source', 'downloader', 'player', 'trending'
    sourceType: 'adhoc',                   // 'adhoc', 'continuous'
    link: 'https://trakt.tv',              // Link to provider site
    // Description of plugin provider
    description: 'Provides various information about media sources'
  };

  this.defaultSettings = {
    enabled: true
  };
  
  TraktTrending.super_.apply( this, arguments );

  return this;
}



/**
 * Stores some info about how trakt and kapture differentiate naming
 */
const typeMappings = [{
  kaptureType: 'movie',
  kaptureAggregateType: 'movies',
  traktType: 'movies',
  traktNonPlural: 'movie'
}, {
  kaptureType: 'series',
  kaptureAggregateType: 'series',
  traktType: 'shows',
  traktNonPlural: 'show'
  // TODO: either remove or pull more stuff?
  // }, {
  //   kaptureType: 'music',
  //   traktType: '',
  //   traktNonPlural: ''
  // }, {
  //   kaptureType: 'photos',
  //   traktType: '',
  //   traktNonPlural: ''
  // }, {
  //   kaptureType: 'other',
  //   traktType: '',
  //   traktNonPlural: ''
}];



/**
 * Main entrypoint to pull down all trending data in the format 
 * kapture expects
 */
TraktTrending.prototype.trending = function trending() {
  return Promise
    .all(typeMappings.map(fetchTrendingTypeObj))
    .then(_.flattenDeep)
    .then((elements) => _.groupBy(elements, 'type'))
    .then(renameSingularToAggregate);
}



/**
 *  Returns information about the 'sourceId' defined ID in the format that 
 *  kapture desires. 
 * 
 *  TODO: define that output format better
 * 
 * @param {String,Integer} id   can be either be a trakt id or a slug.  
 *                              however according to kapture, this needs to be
 *                              the id field
 */
TraktTrending.prototype.trendingInfo = function trendingInfo(id) {
  return new Promise(function (resolve, reject) {
    request({
      method: 'GET',
      url: util.format('https://api.trakt.tv/shows/%s?extended=full', id),
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': clientId
      },
      json: true
    }, function (err, response, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}




/**************************
 * HELPER FUNCTIONS
 **************************/


/**
 *  Takes entries of the format below, and converts them into something 
 *  kapture needs to respond via the api with
 * 
 * Trakt entries look something like this:
 * {
 *   "watchers": 204,
 *   "show": {
 *     "title": "13 Reasons Why",
 *     "year": 2017,
 *     "ids": {
 *       "trakt": 116129,
 *       "slug": "13-reasons-why",
 *       "tvdb": 323168,
 *       "imdb": "tt1837492",
 *       "tmdb": 66788,
 *       "tvrage": null
 *     }
 *   }
 * }
 * 
 * @param {Object} entries   trakt formatted entries
 * @param {Object} typeObj   a type object that describes mappings between
 *                           trakt and kapture
 */
function formatEntries(entries, typeObj) {
  return entries.map((e) => {
    return {
      score: e.watchers,
      sourceId: sourceId,
      id: e[typeObj.traktNonPlural].ids.trakt,
      type: typeObj.kaptureType,
      title: e[typeObj.traktNonPlural].title,
      slug: e[typeObj.traktNonPlural].ids.slug,
      additionalInfoUrl: util.format(traktAdditionalInfoUrl, typeObj.traktType, e[typeObj.traktNonPlural].ids.slug)
    }
  })
}

/** some helper functions to properly map things */
function getAggregateTypeFromSingular(typeStr) {
  return _.find(typeMappings, { kaptureType: typeStr }).kaptureAggregateType;
}

function renameSingularToAggregate(obj) {
  var ret = {};

  Object.keys(obj).forEach((k) => {
    ret[getAggregateTypeFromSingular(k)] = obj[k];
  });

  return ret
}



/**
 * Given a typeObj, will return a promise that will return the proper data
 * based on the request
 * 
 * @param {Object} typeObj  the kapture/trakt mapping object
 */
function fetchTrendingTypeObj(typeObj) {
  return new Promise(function (resolve, reject) {
    request({
      method: 'GET',
      url: util.format('https://api.trakt.tv/%s/trending', typeObj.traktType),
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': clientId
      },
      json: true
    }, function (err, response, body) {
      if (err) {
        reject(err);
      } else {
        resolve(formatEntries(body, typeObj));
      }
    });
  })
}


module.exports = TraktTrending;

/** for running this file manually */
if (require.main === module) {
  (function run() {
    const base = require('../../plugin_handler/plugin_base');
    util.inherits( TraktTrending, base );
    const t = new TraktTrending();

    t.trending()
      .then(console.log)
      .catch(console.log);
  
    t.trendingInfo(60300)
      .then(console.log)
      .catch(console.log);
  })();
}
