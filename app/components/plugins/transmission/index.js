'use strict';

var Promise = require('bluebird');
var request = require('request');
var util    = require('util');
var _       = require('lodash');
var path    = require('path');





var TransmissionDownloader = function( options ) {
  this.metadata = {
    pluginId: 'com_transmissionbt',          // Unique ID of plugin
    pluginName: 'Transmission',              // Display name of plugin
    pluginTypes: 'downloader',               // 'source', 'downloader', 'player'
    sourceTypes: 'adhoc',                    // 'adhoc', 'continuous'
    link: 'https://transmissionbt.com',      // Link to provider site
    downloadProviders: 'torrent',            // if plugin can also download, what
                                             // downloadMechanism can it download?
    description: 'Popular torrent downloader'// Description of plugin provider
  };

  this.defaultSettings = {
    enabled: true,
    transmissionHost: process.env.TRANSMISSION_HOST || 'transmission',
    transmissionPort: process.env.TRANSMISSION_PORT || 9091,
    transmissionUser: process.env.TRANSMISSION_USER || 'admin',
    transmissionPass: process.env.TRANSMISSION_PASS || 'password',
  };

  TransmissionDownloader.super_.apply( this, arguments );

  this.logger.debug( '[TODO] this needs to be fixed, should not be instantiated every time we need to use transmission' );

  // TODO: optimize this messyness
  // TODO: add a path.resolve to the values below
  this.mediaTypePathMap = {
    'movie'  : path.join( this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.movies') ),
    'video'  : path.join( this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.movies') ),
    'tvshow' : path.join( this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.shows') ),
    'audio'  : path.join( this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.music') ),
    'music'  : path.join( this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.music') ),
    'photos' : path.join( this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.music') ),
    'other'  : path.join( this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.default') )
  };

  return this;
}



TransmissionDownloader.prototype.getRpcUrl = function( item ) {
  return util.format( 'http://%s:%s/transmission/rpc',
    this.get('transmissionHost') || 'localhost',
    this.get('transmissionPort') || 9091
  );
}


TransmissionDownloader.prototype.removeDownloadId = function(id) {
  return Promise.reject(new Error('Transmission: removeId() not yet implemented'));
}


TransmissionDownloader.prototype.removeSlug = function(slug) {
  return Promise.reject(new Error('Transmission: removeSlug() not yet implemented'));
}


TransmissionDownloader.prototype.downloadSlug = function(slug) {
  return Promise.reject(new Error('Transmission: downloadSlug() not yet implemented'));
}


// DEPRECATED
TransmissionDownloader.prototype.download = function( item ) {
  var self = this;
  return this.getSessionID().then(function( sessionid ) {
    return new Promise(function(resolve, reject) {
      request({
        url: self.getRpcUrl(),
        method: 'POST',
        auth: {
          user: self.get('transmissionUser'),
          pass: self.get('transmissionPass')
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
          user: self.get('transmissionUser'),
          pass: self.get('transmissionPass')
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
          user: self.get('transmissionUser'),
          pass: self.get('transmissionPass')
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
        user: self.get('transmissionUser'),
        pass: self.get('transmissionPass')
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
