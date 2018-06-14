const Promise = require('bluebird');
const request = require('request');
const Plugin = require('../../plugin_handler/base');

const KAT_JSON_URL = 'https://kat.cr/json.php';


class KickassSource extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'cr_kat',                  // Unique ID of plugin
      pluginName: 'Kickass',               // Display name of plugin
      pluginTypes: 'source',                // 'source', 'downloader', 'player'
      sourceType: 'adhoc',                 // 'adhoc', 'continuous'
      link: 'http://kat.cr',               // Link to provider site
      description: 'General torrent site'  // Description of plugin provider
    };
  
    const defaultSettings = {
      enabled: false // disabled due to broken site
    };
  
    super(metadata, defaultSettings);
  }

  url( url ) {

  };
  
  urlMatches( url ) {
    return false;
  };
  
  search( query ) {
    var self = this;
    return new Promise( function( resolve, reject ) {
      request({
        url: KAT_JSON_URL,
        json: true,
        qs: {
          q: query,
          field: 'seeders',
          sort: 'desc'
        }
      },
      function( err, resp, body ) {
        if (!err && resp.statusCode == 200) {
          resp = transformKatResults( body.list );
  
          self.logger.info( 'Results from kat: ', resp.length );
          resolve( resp );
        } else {
          self.logger.warn( '[kat] cant get results: ', err );
          resolve( [] );
        }
      });
    });
  };
  
  download( url ) {
    return this.url( url );
  };
  
  getDownloadStatus() {
    return [];
  }
  
  // likely doesnt work but neither does the plugin so who cares
  downloadId( id ) {
    return this.url( id );
  };
  
  
  
  transformKatResults( jsonResults ) {
    var self = this;
    return jsonResults.map(function( d ) {
      return {
        sourceId:    self.metadata.pluginId,
        sourceName:  self.metadata.pluginName,      
        title:       d.title,
        uploaded:    d.pubDate,
        category:    d.category,
        mediaType:   self.determineKatMediaType( d ),
        size:        d.size,
        downloadUrl: d.torrentLink,
        hashString:  d.hash,
        peers:       d.peers,
        score:       d.votes
      }
    });
  };
  
  determineKatMediaType( elem ) {
    switch( elem.category ) {
      case 'TV':
        return 'tvshow';
      case 'Movies':
      case 'Anime':
      case 'XXX':
        return 'video';
      case 'Music':
        return 'audio';
      default:
        return 'unknown';
    }
  }
}

module.exports = KickassSource;
