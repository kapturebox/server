const Promise = require('bluebird');
const tpb = require('thepiratebay');
const plugins = require('../../plugin_handler');
const Plugin = require('../../plugin_handler/base');

// do some funky date stuff .. extends Date
require('datejs');



var SIZE_MULTIPLIERS = {};

SIZE_MULTIPLIERS.B = 1;
SIZE_MULTIPLIERS.KiB = (SIZE_MULTIPLIERS.B * 1024);
SIZE_MULTIPLIERS.MiB = (SIZE_MULTIPLIERS.KiB * 1024);
SIZE_MULTIPLIERS.GiB = (SIZE_MULTIPLIERS.MiB * 1024);
SIZE_MULTIPLIERS.TiB = (SIZE_MULTIPLIERS.GiB * 1024);
SIZE_MULTIPLIERS.PiB = (SIZE_MULTIPLIERS.TiB * 1024);
SIZE_MULTIPLIERS.EiB = (SIZE_MULTIPLIERS.PiB * 1024);
SIZE_MULTIPLIERS.ZiB = (SIZE_MULTIPLIERS.EiB * 1024);




class ThepiratebaySource extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'com_piratebay', // Unique ID of plugin
      pluginName: 'ThePirateBay', // Display name of plugin
      pluginTypes: 'source', // 'source', 'downloader', 'player'
      sourceType: 'adhoc', // 'adhoc', 'continuous'
      link: 'http://thepiratebay.se', // Link to provider site
      description: 'General torrent site' // Description of plugin provider
    };

    const defaultSettings = {
      enabled: false
    };

    super(metadata, defaultSettings);
  }


  url(url) {
    return false;
  };

  urlMatches(url) {
    return false;
  };

  search(query) {
    var self = this;
    try {
      return tpb.search(query, {
          orderBy: 'seeds'
        })
        .then(function (results) {
          self.logger.info('[tpb] results: ', results.length);
          return self.transformResults(results);
        })
        .catch(function (err) {
          self.logger.warn('[tpb] cant get results:', err);
          return [];
        });
    } catch (err) {
      return Promise.reject([]);
    }
  };

  download(url) {
    return this.url(url);
  };

  // needs to go out and get the magnet link again?  or should we cache all results?
  // maybe just dont provide an ID and rely on `method` approach
  downloadId(id) {
    const self = this;

    return tpb
      .getTorrent(id)
      .then((result) => {
        const magnetLink = result.magnetLink;
        return plugins
          .getPlugin('com_transmissionbt')
          .downloadSlug(magnetLink);
      });
  };

  getDownloadStatus() {
    return [];
  }


  removeWeirdCharacters(str) {
    return str.replace('\xc2', '')
      .replace('\xa0', '\x20');
  }



  transformResults(jsonResults) {
    var self = this;
    return jsonResults.map(function (d) {
      // uploadDate field and size field needs some transforming
      // uploadDate has some weird special tpb format
      var date;

      try {
        var dateString = self.removeWeirdCharacters(d.uploadDate)
          .replace(/([0-9]{2}-[0-9]{2})\s([0-9]{4})?/, function (match, g1, g2) {
            return g1 + '-' + (g2 ? g2 + ' 00:00' : new Date().toString('yyyy')) + ' ';
          })
          .toLowerCase() +
          '-00:00';


        date = Date.parse(dateString);

        if (date == null) {
          self.logger.warn('[tpb] failed to parse entry date [null]: "%s"', dateString);
        }
      } catch (err) {
        self.logger.warn('[tpb] failed to parse entry date: "%s"', d.uploadDate, err);
      }

      // get rid of weird CDATA comment strings
      var title = d.name.replace(/\/\*.*\*\//, '');

      return {
        sourceId: self.metadata.pluginId,
        sourceName: self.metadata.pluginName,
        tpbUploadDate: d.uploadDate,
        tpbId: d.id,
        tpbCategory: d.category.name + ':' + d.subcategory.name,
        title: title,
        uploaded: date,
        category: d.subcategory.name,
        mediaType: self.determineMediaType(d),
        size: self.convertSize(d.size),
        downloadUrl: d.magnetLink,
        magnetLink: d.magnetLink,
        hashString: d.magnetLink.match(/urn:btih:([a-z0-9]{40})/)[1],
        peers: parseInt(d.seeders) + parseInt(d.leechers),
        seeders: parseInt(d.seeders),
        leechers: parseInt(d.leechers),
        score: self.calculateScore(d),
        sourceData: d,
        downloadMechanism: 'torrent',
        slug: Buffer.from(d.magnetLink).toString('base64'),
        id: d.id
      }
    });
  };



  determineMediaType(elem) {
    switch (elem.category.name + ':' + elem.subcategory.name) {
      case 'Video:HD - TV shows':
      case 'Video:TV shows':
        return 'shows';
      case 'Video:Movies':
      case 'Video:HD - Movies':
      case 'Video:undefined':
      case 'Video:':
      case 'Video:Anime':
      case 'Video:XXX':
      case 'Porn:Movie clips':
      case 'Porn:':
      case 'Porn:Movies':
      case 'Porn:HD - Movies':
        return 'movies';
      case 'Audio':
      case 'Audio:Music':
      case 'Audio:Other':
        return 'music';
      default:
        return 'default';
    }
  }

  calculateScore(result) {
    const MAX_ACTIVE_SEEDERS = 10000;

    return result.seeders / MAX_ACTIVE_SEEDERS;
  }


  convertSize(sizeString) {
    var split = this.removeWeirdCharacters(sizeString).split(' ');
    return parseFloat(split[0]) * SIZE_MULTIPLIERS[split[1]];
  }
}


module.exports = ThepiratebaySource;
