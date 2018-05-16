'use strict';

var Promise = require('bluebird');
var request = require('request');
var util    = require('util');
var _       = require('lodash');
var path    = require('path');





var TransmissionDownloader = function( options ) {
  this.metadata = {
    pluginId: 'com.transmissionbt',          // Unique ID of plugin
    pluginName: 'Transmission',              // Display name of plugin
    pluginTypes: 'downloader',               // 'source', 'downloader', 'player'
    sourceTypes: 'adhoc',                    // 'adhoc', 'continuous'
    link: 'https://transmissionbt.com',      // Link to provider site
    downloadProviders: 'torrent',            // if plugin can also download, what
                                             // downloadMechanism can it download?
    description: 'Popular torrent downloader'// Description of plugin provider
  };

  TransmissionDownloader.super_.apply( this, arguments );

  this.logger.debug( '[TODO] this needs to be fixed, should not be instantiated every time we need to use transmission' );

  this.mediaTypePathMap = {
    'movie'  : path.join( this.config.getUserSetting('rootDownloadPath'), this.config.getUserSetting('moviesPath') ),
    'video'  : path.join( this.config.getUserSetting('rootDownloadPath'), this.config.getUserSetting('moviesPath') ),
    'tvshow' : path.join( this.config.getUserSetting('rootDownloadPath'), this.config.getUserSetting('showsPath') ),
    'audio'  : path.join( this.config.getUserSetting('rootDownloadPath'), this.config.getUserSetting('musicPath') ),
    'music'  : path.join( this.config.getUserSetting('rootDownloadPath'), this.config.getUserSetting('musicPath') ),
    'photos' : path.join( this.config.getUserSetting('rootDownloadPath'), this.config.getUserSetting('photosPath') ),
    'other'  : path.join( this.config.getUserSetting('rootDownloadPath'), this.config.getUserSetting('defaultMediaPath') )
  }

  return this;
}



TransmissionDownloader.prototype.getRpcUrl = function( item ) {
  return util.format( 'http://%s:%s/transmission/rpc',
    this.get('transmission_host') || 'localhost',
    this.get('transmission_port') || 9091
  );
}



TransmissionDownloader.prototype.download = function( item ) {
  var self = this;
  return this.getSessionID().then(function( sessionid ) {
    return new Promise(function(resolve, reject) {
      request({
        url: self.getRpcUrl(),
        method: 'POST',
        auth: {
          user: self.get('transmission_user'),
          pass: self.get('transmission_pass')
        },
        json: {
          method: 'torrent-add',
          arguments: {
            'filename':     item.downloadUrl,
            'download-dir': self.getDownloadPath( item )
          }
        },
        headers: {
          'X-Transmission-Session-Id': sessionid,
        }
      }, function( err, resp, body ) {
        if( err || resp.statusCode !== 200 || body.result !== 'success' ) {
          reject( new Error(
            util.format( '[Transmission] code: %s, body: %s', resp.statusCode, JSON.stringify(body) )
          ));
        } else {
          // TODO: Check to see if the hash from the response matches that
          // of the hash that came back from the source
          resolve( resp );
        }
      });
    })
  });
}


// takes the item as generated in search, and removes from list (with delete option if present)
TransmissionDownloader.prototype.remove = function( item, deleteOnDisk ) {
  var self = this;
  return this.getSessionID().then(function( sessionid ) {
    return new Promise(function( resolve, reject ) {
      request({
        url: self.getRpcUrl(),
        method: 'POST',
        auth: {
          user: self.get('transmission_user'),
          pass: self.get('transmission_pass')
        },
        json: {
          method: 'torrent-remove',
          arguments: {
            'ids':               item.hashString,
            'delete-local-data': deleteOnDisk || false
          }
        },
        headers: {
          'X-Transmission-Session-Id': sessionid,
        }
      }, function( err, resp, body ) {
        if( err ) {
          reject( new Error(
            util.format( '[Transmission] code: %s, body: %s', resp.statusCode, JSON.stringify(body) )
          ));
        } else {
          self.logger.info( 'Successfully removed: ', item.name );
          resolve( body );
        }
      });
    })
  });
}


TransmissionDownloader.prototype.status = function( item ) {
  var self = this;
  return this.getSessionID().then(function( sessionid ) {
    return new Promise(function( resolve, reject ) {
      request({
        url: self.getRpcUrl(),
        method: 'POST',
        auth: {
          user: self.get('transmission_user'),
          pass: self.get('transmission_pass')
        },
        json: {
          method: 'torrent-get',
          arguments: {
            fields: [
              'name',
              'totalSize',
              'eta',
              'rateDownload',
              'isFinished',
              'isStalled',
              'percentDone',
              'downloadDir',
              'hashString',
              'startDate',
              'doneDate',
              'addedDate'
            ]
          }
        },
        headers: {
          'X-Transmission-Session-Id': sessionid,
        }
      }, function( err, resp, body ) {
        if( err || resp.statusCode !== 200 || body.result !== 'success' ) {
          reject( new Error(
            util.format( 'cant parse output from transmission: (Resp code: %s): %s \n%s',  resp.statusCode, err, JSON.stringify(resp.body) )
          ));
        } else {
          var ret = body.arguments.torrents.map(function(obj) {
            return {
              mediaType:         self.getMediaTypeFromPath( obj['downloadDir'] ),
              sourceId:          self.metadata.pluginId,
              size:              obj.totalSize,
              startDate:         new Date( ( obj.startDate || obj.doneDate ) * 1000 ),  // this function expects milliseconds
              title:             obj.name,
              downloadMechanism: 'torrent',
              hashString:        obj.hashString,
              percentDone:       obj.percentDone,
              rateDownload:      obj.rateDownload,
              eta:               obj.eta,
              isFinished:        obj.isFinished,
              isStalled:         obj.isStalled,
              source_data:       obj
            };
          });

          resolve( ret );
        }
      });
    });
  });
}


TransmissionDownloader.prototype.getDownloadPath = function ( item ) {
  return this.mediaTypePathMap[ item.mediaType ] || 'other';
}

TransmissionDownloader.prototype.getMediaTypeFromPath = function ( path ) {
  return _.invert( this.mediaTypePathMap )[ path ] || 'other';
}


TransmissionDownloader.prototype.getSessionID = function () {
  var self = this;
  return new Promise( function( resolve, reject ) {
    request({
      url: self.getRpcUrl(),
      method: 'POST',
      auth: {
        user: self.get('transmission_user'),
        pass: self.get('transmission_pass')
      }
    }, function( err, resp, body ) {
      if( !err && resp.statusCode != 200 ) {
        resolve( resp.headers['x-transmission-session-id'] );
      } else {
        var errMsg = util.format('[Transmission] cant get session id:', err );
        if( resp ) {
          errMsg = util.format( '[Transmission] cant parse output from transmission: (Resp code: %s): %s \n%s',  resp.statusCode, err, resp.body );
        }
        reject( new Error( errMsg ));
      }
    });
  });
}



module.exports = TransmissionDownloader;
