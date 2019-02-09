// Torrent search api that uses this lib:
// https://www.npmjs.com/package/torrent-search-api

const _ = require('lodash');
const TorrentSearchApi = require('torrent-search-api');
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







  ////////////// LISTING OF PROVIDERS
  // [ '1337x',
  // 'ExtraTorrent',   /// SLLOOWWW
  // 'KickassTorrents',
  // 'Rarbg',
  // 'ThePirateBay',
  // 'Torrent9',
  // 'TorrentProject', // SLOOOWWW
  // 'Torrentz2' ]



  // api.search(query)
  //   .then(res => _.groupBy(res, 'provider'))
  //   .then(res =>
  //     Object.keys(res)
  //       .forEach(e =>
  //         console.log(e, JSON.stringify(res[e][0], null, 2))
  //   ));

  // > ExtraTorrent {
  //   "title": "[Big Tits At Work/Brazzers]Sunny Lane & Savanah Gold - A Little Privacy",
  //   "time": "3 mo",
  //   "size": "320.10 MB",
  //   "magnet": "magnet:?xt=urn:btih:40AFE8E8777A1766DBC89B8CE83605C5A3EDD782&dn=%5BBig+Tits+At+Work%2FBrazzers%5DSunny+Lane+%26+Savanah+Gold+-+A+Little+Privacy&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce;tr=udp%3A%2F%2Ftracker.coppersurfer.tk;tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce;tr=udp%3A%2F%2Feddie4.nl%3A6969%2Fannounce;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce;tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce;tr=udp%3A%2F%2F62.138.0.158%3A6969%2Fannounce;tr=udp%3A%2F%2F62.138.0.158%3A1337%2Fannounce;tr=udp%3A%2F%2F62.138.0.158%3A80%2Fannounce;tr=udp%3A%2F%2Fshadowshq.yi.org%3A6969%2Fannounce;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A1337%2Fannounce;tr=http%3A%2F%2F182.176.139.129%3A6969%2Fannounce;tr=http%3A%2F%2F5.79.83.193%3A2710%2Fannounce;tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A80%2Fannounce;tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A1337%2Fannounce",
  //   "desc": "http://extratorrent.ag/torrent/7329660/%5BBig+Tits+At+Work%2FBrazzers%5DSunny+Lane+%26+Savanah+Gold+-+A+Little+Privacy.html",
  //   "provider": "ExtraTorrent"
  // }


  // Torrentz2 {
  //   "title": "Its Always Sunny in Philadelphia Season 1, 2, 3, 4, 5 & 6 + Extras DVDRip TSV",
  //   "hash": "4ddb6ed03f413ef34718111697573c839ed30eb9",
  //   "time": "7 years",
  //   "size": "15 GB",
  //   "seeds": 105,
  //   "peers": 143,
  //   "magnet": "magnet:?xt=urn:btih:4ddb6ed03f413ef34718111697573c839ed30eb9",
  //   "link": "http://itorrents.org/torrent/4ddb6ed03f413ef34718111697573c839ed30eb9.torrent",
  //   "provider": "Torrentz2"
  // }

  // Rarbg {
  //   "provider": "Rarbg",
  //   "title": "Its.Always.Sunny.in.Philadelphia.S13E10.720p.WEBRip.x264-TBS[rartv]",
  //   "time": "2018-11-08 03:19:09 +0000",
  //   "seeds": 94,
  //   "peers": 0,
  //   "size": "508.0 MiB",
  //   "magnet": "magnet:?xt=urn:btih:a5df4f870b51c34f154eec67b6cad97c3594aca2&dn=Its.Always.Sunny.in.Philadelphia.S13E10.720p.WEBRip.x264-TBS%5Brartv%5D&tr=http%3A%2F%2Ftracker.trackerfix.com%3A80%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2710&tr=udp%3A%2F%2F9.rarbg.to%3A2710&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce",
  //   "desc": "https://torrentapi.org/redirect_to_info.php?token=ps0nrhzwa7&p=1_6_8_3_2_3_8__a5df4f870b"
  // }








  /////////// NOT USING
  // Torrent9 {
  //   "title": "NRJ Sunny Hits 2018",
  //   "seeds": 20,
  //   "peers": 3,
  //   "size": "470.9 Mo",
  //   "desc": "https://wvw.torrent9.uno/torrent/60289/nrj-sunny-hits-2018",
  //   "provider": "Torrent9"
  // }

  /////////// NOT USING
  // 1337x {
  //   "title": "Its.Always.Sunny.in.Philadelphia.S13E02.720p.HDTV.x264-KILLERS[ettv]",
  //   "time": "Sep. 13th '18",
  //   "seeds": 1006,
  //   "peers": 52,
  //   "size": "670.3 MB",
  //   "desc": "http://www.1337x.to/torrent/3227320/Its-Always-Sunny-in-Philadelphia-S13E02-720p-HDTV-x264-KILLERS-ettv/",
  //   "provider": "1337x"
  // }












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
      enabled: true
    };

    super(metadata, defaultSettings);

    // enable all public providers from the lib
    const api = TorrentSearchApi;

    api.enablePublicProviders();

    // disable some slow providers
    api.disableProvider('ExtraTorrent');
    api.disableProvider('TorrentProject');

    // these just doesnt let pull from url
    api.disableProvider('Torrent9');
    api.disableProvider('1337x');

    this.api = api;
  }


  url(url) {
    return false;
  };

  urlMatches(url) {
    return false;
  };

  async search(query) {
    // const results = TorrentSearchApi.search(query, 'Movies', 20);
    try {
      const results = await this.api.search(query);
      this.logger.info('[torrentsearchapi] raw results: ', results.length);

      const transformed = this.transformResults(results);
      this.logger.debug('[torrentsearchapi] transformed:', transformed)

      const ordered = _.sortBy(transformed, 'score')

      return ordered;
    } catch(err) {
      this.logger.warn('[torrentsearchapi] cant get results:', err);
      return [];
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
        const magnet = result.magnet;
        return plugins
          .getPlugin('com_transmissionbt')
          .downloadSlug(magnet);
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
    return jsonResults.map(this.transformResult.bind(this));

    // var self = this;
    // return jsonResults.map(function (d) {
    //   // uploadDate field and size field needs some transforming
    //   // uploadDate has some weird special tpb format
    //   // var date;

    //   try {
    //     var dateString = self.removeWeirdCharacters(d.uploadDate)
    //       .replace(/([0-9]{2}-[0-9]{2})\s([0-9]{4})?/, function (match, g1, g2) {
    //         return g1 + '-' + (g2 ? g2 + ' 00:00' : new Date().toString('yyyy')) + ' ';
    //       })
    //       .toLowerCase() +
    //       '-00:00';


    //     date = Date.parse(dateString);

    //     if (date == null) {
    //       self.logger.warn('[tpb] failed to parse entry date [null]: "%s"', dateString);
    //     }
    //   } catch (err) {
    //     self.logger.warn('[tpb] failed to parse entry date: "%s"', d.uploadDate, err);
    //   }

    //   // get rid of weird CDATA comment strings
    //   var title = d.name.replace(/\/\*.*\*\//, '');

    // });
  };

  transformResult(object) {
    var transformed = {
      sourceId: this.metadata.pluginId,
      sourceName: this.metadata.pluginName,
      downloadMechanism: 'torrent',
      title: object.title,
      size: object.size,
      downloadUrl: object.magnet,
      magnetLink: object.magnet,
      hashString: object.magnet.match(/urn:btih:([a-z0-9]{40})/)[1],
      peers: parseInt(object.seeds) + parseInt(object.peers),
      seeders: parseInt(object.seeds),
      leechers: parseInt(object.peers),
      score: this.calculateScore(object),
      slug: Buffer.from(object.magnet).toString('base64'),
      sourceData: object,

      // dont think we can figure these out from results
      // category: object.subcategory.name,
      // mediaType: self.determineMediaType(d),
      // id: object.id
    }

    switch(object.provider) {
      case 'ExtraTorrent':
        transformed.uploaded = this.convertSize(object.time);
        break;
      case 'Torrentz2':
        transformed.uploaded = this.convertSize(object.time);
        break;
      case 'Rarbg':
        transformed.uploaded = Date.parse(object.time);
        break;
    }

    return transformed;
  }



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
    const MAX_ACTIVE_SEEDERS = 1000;

    return result.seeds / MAX_ACTIVE_SEEDERS;
  }


  convertSize(sizeString) {
    const split = this.removeWeirdCharacters(sizeString).split(' ');
    return parseFloat(split[0]) * SIZE_MULTIPLIERS[split[1]];
  }
}


module.exports = ThepiratebaySource;
