const Promise = require('bluebird');
const request = require('request');
const _ = require('lodash');
const util = require('util');
const path = require('path');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const xml2js = require('xml2json-light');
const Plugin = require('../../plugin_handler/base');
const plugins = require('../../plugin_handler');



// %d is the id # as stored by showrss
const SHOW_HISTORY_DATA_URL = 'https://showrss.info/show/%d.rss';
const UPCOMING_EPISODES_URL = 'https://showrss.info/show/schedule/%d.rss';


class ShowRssSource extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'info_showrss',                 // Unique ID of plugin
      pluginName: 'ShowRss',                    // Display name of plugin
      pluginTypes: ['source', 'series'],         // 'source', 'downloader', 'player'
      sourceType: 'continuous',                 // 'adhoc', 'continuous'
      requires: ['com_flexget', 'com_transmissionbt'],  // this plugin requires the flexget plugin
      link: 'http://showrss.info/',             // Link to provider site
      description: 'Updated feed of TV shows'   // Description of plugin provider
    };

    const defaultSettings = {
      enabled: true
    };

    super(metadata, defaultSettings);
  }



  search(query) {
    const self = this;
    const SHOWS_URL = 'http://showrss.info/browse';
    const SHOWS_XPATH = '//*[@id="showselector"]/option';

    if (_.isEmpty(query)) {
      return Promise.reject(new Error('no query string in search'));
    }

    return new Promise(function (resolve, reject) {
      request({
        url: SHOWS_URL
      }, function (err, resp, body) {
        if (err) return reject(err);

        try {
          var doc = new dom({ errorHandler: function (o) { } }).parseFromString(body);
          var shownames_xml = xpath.select(SHOWS_XPATH, doc);
        } catch (err) {
          return reject(new Error(`cant parse showrss xml: ${err}`));
        }

        var shownames = _.filter(shownames_xml, function (e) {
          return e.firstChild !== undefined;
        }).map(function (e) {
          const slug = Buffer
            .from(`info_showrss:${e.getAttribute('value')}`)
            .toString('base64');

          return {
            sourceId: self.metadata.pluginId,
            sourceName: self.metadata.pluginName,
            score: self.calculateScore(e),
            downloadMechanism: 'flexget',
            flexgetModel: 'showrss',
            mediaType: 'series',
            id: e.getAttribute('value'),
            slug: slug,
            category: 'TV Shows',
            size: 'N/A',
            title: e.firstChild.data
          };
        });

        // gives us just what was searched for
        var shownames_filtered = _.filter(shownames, function (obj) {
          return obj
            && _.isString(obj.title)
            && obj.title.toLowerCase().indexOf(query.toLowerCase()) > -1;
        });

        self.logger.info('[showrss] results: %s', shownames_filtered.length);
        resolve(shownames_filtered);
      })
    });
  };


  removeId(id) {
    var self = this;
    return new Promise(function (resolve, reject) {
      try {
        self.removeState(id);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  disableId(id) { return removeId(id) };


  calculateScore(result) {
    return 1.0 / 10;
  }

  status() {
    return Promise.resolve([]);  // uses torrent downloader and flexget
  }

  // DEPRECATED
  download(item) {
    return this.enableId(item.id);
  };

  // DEPRECATED
  remove(item) {
    var self = this;
    return new Promise(function (resolve, reject) {
      try {
        self.removeState(item.id);
        resolve(item);
      } catch (err) {
        reject(new Error(err.toString()));
      }
    });
  }



  ///////////////////
  // SERIES SPECIFIC
  ///////////////////




  /** Returns an object that looks something like this:
   * id: id
   * title: name of show
   * seen:
   *   - magnet: <link>
   *     title: title of episode
   * upcoming:
   *   - title: title of episode
   *     date: if available
   *
   * @param {*} showId
   */

  info(showId) {
    return Promise.all([
      this.getSeenEpisodes(showId),
      this.getUpcomingEpisodes(showId)
    ])
    .then((results) => {
      return {
        id: showId,
        title: results[0][0].showName, // yes this is a cheat
        seen: results[0],
        upcoming: results[1]
      }
    })
  }

  getUpcomingEpisodes(showId) {
    return new Promise(function (resolve, reject) {
      request({
        url: util.format(UPCOMING_EPISODES_URL, showId)
      }, function (err, resp, body) {
        if (err) {
          return reject(new Error(err.toString()));
        }
        try {
          const ugly_items = xml2js.xml2json(body).rss.channel;
          const items = ugly_items['item'];

          if(!items)
            resolve([]);

          resolve(items.map((e) => {
            return {
              description: e['description'],
              date: e['pubDate'],
              title: e['title'],
              detailLink: e['link']
            };
          }));
        } catch(err) {
          reject(err);
        }
      })
    });
  }

  getSeenEpisodes(showId) {
    return new Promise(function (resolve, reject) {
      request({
        url: util.format(SHOW_HISTORY_DATA_URL, showId)
      }, function (err, resp, body) {
        if (err) {
          return reject(new Error(err.toString()));
        }

        try {
          var ugly_items = xml2js.xml2json(body).rss.channel;
          var items = ugly_items['item'];

          if (!items)
            return resolve([]);

          resolve(items.map(function (e) {
            return {
              title: e['title'],
              showName: e['tv:show_name'],
              hashString: e['showrss:info_hash'],
              slug: Buffer.from(e['link']).toString('base64'),
              downloadMechanism: 'torrent',
              uploaded: e['pubDate'],
              rawTitle: e['showrss:rawtitle'],
            };
          }));
        } catch (err) {
          return reject(new Error(`cant parse showrss xml content: ${err}`));
        }
      });
    });
  }

  // DEPRECATED
  add(item) {
    var self = this;
    return new Promise(function (resolve, reject) {
      try {
        self.setState(item.id, item);
        resolve(item);
      } catch (err) {
        reject(new Error(err.toString()));
      }
    });
  }

  /**
   *
   * @param {String} id   the source provided id
   */
  enableId(id) {
    var self = this;
    var returnedInfo;

    return self
      .info(id)
      .then((info) => {
        self.setState(id, info);
        self.events.emit('continuous:added', info);
        returnedInfo = info;
        return plugins.getPlugin('com_flexget').getModelsAndUpdateFlexget();
      })
      .then(() => returnedInfo);
  }

  downloadId(id) {return this.enableId(id)};


  getEnabledSeriesNames() {
    return this.getState().map(function (e) {
      return e.title;
    });
  }

  getEnabledSeriesIds() {
    return this.stateStore.keys();
  }


  getEnabledSeries() {
    const self = this;
    return this.getState().map((e) => {
      return {
        id: e['id'],
        title: e['title'],
        sourceId: self.metadata.pluginId
      }
    });
  }

  flexgetTemplateModel() {
    const transmissionConfig = plugins.getPlugin('com_transmissionbt');

    return {
      showrss: {
        all_series: true,
        transmission: {
          host: transmissionConfig.get('transmissionHost'),
          port: parseInt(transmissionConfig.get('transmissionPort')),
          username: transmissionConfig.get('transmissionUser'),
          password: transmissionConfig.get('transmissionPass'),
          path: path.resolve(path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.shows')))
        }
      }
    }
  }


  flexgetTaskModel() {
    var self = this;
    var seriesIds = self.getEnabledSeriesIds();
    var taskObject = {};

    if (_.isEmpty(seriesIds)) {
      return { noop: { manual: true } };
    }

    seriesIds.forEach(function (id) {
      taskObject[util.format('showRssId%d', id)] = {
        rss: util.format(SHOW_HISTORY_DATA_URL, id),
        template: 'showrss'
      };
    });

    return taskObject;
  }




  ////////////////
  // Maybe trash?
  ////////////////


  // url = function( url ) {
  // };

  // urlMatches = function( url ) {
  //   return false;
  // };


}



module.exports = ShowRssSource;
