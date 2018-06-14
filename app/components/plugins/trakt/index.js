const Promise = require('bluebird');
const util = require('util');
const _ = require('lodash');
const request = require('request');
const Plugin = require('../../plugin_handler/base');


// TODO: put into settings
const CLIENT_ID = 'fe722213d0c097ed33e320d28b3fca53edcd66b6ca118ea29bd60d908b705b88';
const TRAKT_ADDITIONAL_INFO_URL = 'https://trakt.tv/%s/%s'  // 1: type, 2: slug


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
}];


class TraktTrending extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'tv_trakt',                  // Unique ID of plugin
      pluginName: 'Trakt',                   // Display name of plugin
      pluginTypes: 'trending',               // 'source', 'downloader', 'player', 'trending'
      sourceType: 'adhoc',                   // 'adhoc', 'continuous'
      link: 'https://trakt.tv',              // Link to provider site
      // Description of plugin provider
      description: 'Provides various information about media sources'
    };
  
    const defaultSettings = {
      enabled: true
    };
    
    super(metadata, defaultSettings);
  }


  /**
   * Main entrypoint to pull down all trending data in the format 
   * kapture expects
   */
  trending() {
    return Promise
      .all(typeMappings.map(this.fetchTrendingTypeObj.bind(this)))
      .then(_.flattenDeep)
      .then((elements) => _.groupBy(elements, 'type'))
      .then(this.renameSingularToAggregate.bind(this));
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
  trendingInfo(id) {
    const type = id.split('-')[0];
    const realId = id.split('-')[1];

    if( ! realId.match(/^[0-9]+$/) || ! type.match(/^[a-z]+$/) ) {
      let err = new Error(`invalid id provided: ${id}`);
      err.statusCode = 400;
      throw err;
    }

    const url = util.format('https://api.trakt.tv/%s/%s?extended=full', type, realId);

    return new Promise(function (resolve, reject) {
      request({
        method: 'GET',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': CLIENT_ID
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
  formatEntries(entries, typeObj) {
    var self = this;

    return entries.map((e) => {
      return {
        score: e.watchers,
        sourceId: self.metadata.pluginId,
        id: `${typeObj.traktType}-${e[typeObj.traktNonPlural].ids.trakt}`,
        type: typeObj.kaptureType,
        title: e[typeObj.traktNonPlural].title,
        slug: e[typeObj.traktNonPlural].ids.slug,
        additionalInfoUrl: util.format(TRAKT_ADDITIONAL_INFO_URL, typeObj.traktType, e[typeObj.traktNonPlural].ids.slug)
      }
    })
  }

  /** some helper functions to properly map things */
  getAggregateTypeFromSingular(typeStr) {
    return _.find(typeMappings, { kaptureType: typeStr }).kaptureAggregateType;
  }

  renameSingularToAggregate(obj) {
    var ret = {};
    var self = this;

    Object.keys(obj).forEach((k) => {
      ret[self.getAggregateTypeFromSingular(k)] = obj[k];
    });

    return ret
  }



  /**
   * Given a typeObj, will return a promise that will return the proper data
   * based on the request
   * 
   * @param {Object} typeObj  the kapture/trakt mapping object
   */
  fetchTrendingTypeObj(typeObj) {
    const self = this;

    return new Promise(function (resolve, reject) {
      request({
        method: 'GET',
        url: util.format('https://api.trakt.tv/%s/trending', typeObj.traktType),
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': CLIENT_ID
        },
        json: true
      }, function (err, response, body) {
        if (err) {
          reject(err);
        } else {
          resolve(self.formatEntries(body, typeObj));
        }
      });
    })
  }

}



module.exports = TraktTrending;

/** for running this file manually */
if (require.main === module) {
  (function run() {
    const t = new TraktTrending();

    t.trending()
      .then(console.log)
      .catch(console.error);
  
    t.trendingInfo('movies-60300')
      .then(console.log)
      .catch(console.error);
  })();
}
