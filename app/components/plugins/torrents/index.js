// Torrent search api that uses this lib:
// https://www.npmjs.com/package/torrent-search-api

const _ = require('lodash');
const TorrentSearchApi = require('torrent-search-api');
const plugins = require('../../plugin_handler');
const Plugin = require('../../plugin_handler/base');

// do some funky date stuff .. extends Date
require('datejs');


// Helpful size translators
var SIZE_MULTIPLIERS = {};

SIZE_MULTIPLIERS.B = 1;
SIZE_MULTIPLIERS.KB = (SIZE_MULTIPLIERS.B * 1024);
SIZE_MULTIPLIERS.MB = (SIZE_MULTIPLIERS.KB * 1024);
SIZE_MULTIPLIERS.GB = (SIZE_MULTIPLIERS.MB * 1024);
SIZE_MULTIPLIERS.TB = (SIZE_MULTIPLIERS.GB * 1024);
SIZE_MULTIPLIERS.PB = (SIZE_MULTIPLIERS.TB * 1024);
SIZE_MULTIPLIERS.EB = (SIZE_MULTIPLIERS.PB * 1024);
SIZE_MULTIPLIERS.ZB = (SIZE_MULTIPLIERS.EB * 1024);

SIZE_MULTIPLIERS.KiB = (SIZE_MULTIPLIERS.B * 1024);
SIZE_MULTIPLIERS.MiB = (SIZE_MULTIPLIERS.KB * 1024);
SIZE_MULTIPLIERS.GiB = (SIZE_MULTIPLIERS.MB * 1024);
SIZE_MULTIPLIERS.TiB = (SIZE_MULTIPLIERS.GB * 1024);
SIZE_MULTIPLIERS.PiB = (SIZE_MULTIPLIERS.TB * 1024);
SIZE_MULTIPLIERS.EiB = (SIZE_MULTIPLIERS.PB * 1024);
SIZE_MULTIPLIERS.ZiB = (SIZE_MULTIPLIERS.EB * 1024);




class TorrentSearchSource extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'com_kapture_torrent', // Unique ID of plugin
      pluginName: 'TorrentSearch',     // Display name of plugin
      pluginTypes: 'source',           // 'source', 'downloader', 'player'
      sourceType: 'adhoc',             // 'adhoc', 'continuous'
      link: 'https://github.com/JimmyLaurent/torrent-search-api',  // Link to provider site
      description: 'Generic torrent search library' // Description of plugin provider
    };

    const defaultSettings = {
      enabled: true
    };

    super(metadata, defaultSettings);

    // enable all public providers from the lib
    const api = TorrentSearchApi;

    // enable only those that return magnets
    api.enableProvider('Eztv')
    api.enableProvider('ThePirateBay')

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
      this.logger.info('[torrentsearchapi] results: %s', results.length);

      const transformed = this.transformResults(results);
      // this.logger.debug('[torrentsearchapi] transformed:', transformed)

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
    // id = magnet
    const magnet = Buffer.from(id, 'base64').toString('ascii')
    return plugins
      .getPlugin('com_transmissionbt')
      .downloadSlug(magnet);
  };

  getDownloadStatus() {
    return [];
  }

  transformResults(jsonResults) {
    return jsonResults.map(this.transformResult.bind(this));
  };

  transformResult(object) {
    const transformed = {
      sourceId: this.metadata.pluginId,
      sourceName: this.metadata.pluginName,
      downloadMechanism: 'torrent',
      title: object.title,
      size: this.convertSize(object.size),
      uploaded: Date.parse(object.time),
      downloadUrl: object.magnet,
      magnetLink: object.magnet,
      hashString: object.magnet.match(/urn:btih:([^&]+)&/)[1],
      peers: parseInt(object.seeds) + parseInt(object.peers),
      seeders: parseInt(object.seeds),
      leechers: parseInt(object.peers),
      score: this.calculateScore(object),
      slug: Buffer.from(object.magnet).toString('base64'),
      id: Buffer.from(object.magnet).toString('base64'),
      sourceData: object,

      // required to determine where to save, but need a better way to determine this
      mediaType: 'shows',

      // dont think we can figure these out from results
      // category: object.subcategory.name,
    }

    switch(object.provider) {
      case 'ExtraTorrent':
        break;
      case 'Torrentz2':
        transformed.uploaded = Date.parse(object.time + " ago");
        break;
      case 'Rarbg':
        break;
    }

    return transformed;
  }

  calculateScore(result) {
    const MAX_ACTIVE_SEEDERS = 1000;
    return result.seeds / MAX_ACTIVE_SEEDERS;
  }

  convertSize(sizeString) {
    try {
      const splitted = sizeString.split(' ');
      return parseFloat(splitted[0]) * SIZE_MULTIPLIERS[splitted[1]];
    } catch(err) {
      this.logger.debug(`[torrentsearchapi] couldn't parse size string: ${sizeString}`)
      return 0;
    }

  }
}


module.exports = TorrentSearchSource;







////////////////////////////////////////
// API REFERENCE FOR TorrentSearchApi
////////////////////////////////////////

////////////// LISTING OF PROVIDERS
// [ '1337x',
// 'ExtraTorrent',   /// SLLOOWWW
// 'KickassTorrents',
// 'Rarbg',
// 'ThePirateBay',
// 'Torrent9',
// 'TorrentProject', // SLOOOWWW
// 'Torrentz2' ]


//////////// Outputs data per provider
// api.search(query)
//   .then(res => _.groupBy(res, 'provider'))
//   .then(res =>
//     Object.keys(res)
//       .forEach(e =>
//         console.log(e, JSON.stringify(res[e][0], null, 2))
//   ));

//////////// RESULTS from that
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
