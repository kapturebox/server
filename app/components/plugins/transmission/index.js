const Promise = require('bluebird');
const request = require('request');
const util = require('util');
const _ = require('lodash');
const path = require('path');
const Plugin = require('../../plugin_handler/base');





class TransmissionDownloader extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'com_transmissionbt', // Unique ID of plugin
      pluginName: 'Transmission', // Display name of plugin
      pluginTypes: 'downloader', // 'source', 'downloader', 'player'
      sourceTypes: 'adhoc', // 'adhoc', 'continuous'
      link: 'https://transmissionbt.com', // Link to provider site
      downloadProviders: 'torrent', // if plugin can also download, what
      // downloadMechanism can it download?
      description: 'Popular torrent downloader' // Description of plugin provider
    };

    const defaultSettings = {
      enabled: true,
      transmissionHost: process.env.TRANSMISSION_HOST || 'transmission',
      transmissionPort: process.env.TRANSMISSION_PORT || 9091,
      transmissionUser: process.env.TRANSMISSION_USER || 'admin',
      transmissionPass: process.env.TRANSMISSION_PASS || 'password',
    };

    super(metadata, defaultSettings);

    // TODO: optimize this messiness
    // TODO: add a path.resolve to the values below
    this.mediaTypePathMap = {
      'movie': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.movies')),
      'movies': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.movies')),
      'video': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.movies')),
      'videos': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.movies')),
      'tvshow': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.shows')),
      'shows': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.shows')),
      'show': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.shows')),
      'audio': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.music')),
      'music': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.music')),
      'photos': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.music')),
      'default': path.join(this.config.getUserSetting('downloadPaths.root'), this.config.getUserSetting('downloadPaths.default'))
    };
  }

  getRpcUrl(item) {
    return util.format('http://%s:%s/transmission/rpc',
      this.get('transmissionHost') || 'localhost',
      this.get('transmissionPort') || 9091
    );
  }


  removeDownloadId(id, fromDisk) {
    return this.removeId(id, fromDisk);
  }


  removeSlug(slug) {
    return Promise.reject(new Error('Transmission: removeSlug() not yet implemented'));
  }

  // lets assume for now that we're getting passed a magnet, that eventually should
  // handle urls as well though
  downloadSlug(slug, where) {
    return this.downloadMagnet(slug, this.getDownloadPath(where));
  }


  // DEPRECATED
  download(item) {
    return this.downloadMagnet(item.downloadUrl, this.getDownloadPath(item.mediaType));
  }


  downloadMagnet(magnet, where) {
    var self = this;
    return this.getSessionID().then(function (sessionid) {
      return new Promise(function (resolve, reject) {
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
              'filename': magnet,
              'download-dir': where
            }
          },
          headers: {
            'X-Transmission-Session-Id': sessionid,
          }
        }, function (err, resp, body) {
          if (err || resp.statusCode !== 200 || body.result !== 'success') {
            reject(new Error(
              util.format('[Transmission] code: %s, body: %s', resp.statusCode, JSON.stringify(body))
            ));
          } else {
            // TODO: Check to see if the hash from the response matches that
            // of the hash that came back from the source
            resolve(resp);
          }
        });
      })
    });
  }

  // DEPRECATED
  remove(item, deleteOnDisk) {
    return this.removeId(item.hashString, deleteOnDisk);
  }

  // takes the item as generated in search, and removes from list (with delete option if present)
  removeId(id, deleteOnDisk) {
    var self = this;
    return this.getSessionID().then(function (sessionid) {
      return new Promise(function (resolve, reject) {
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
              'ids': id,
              'delete-local-data': deleteOnDisk || false
            }
          },
          headers: {
            'X-Transmission-Session-Id': sessionid,
          }
        }, function (err, resp, body) {
          if (err) {
            reject(new Error(
              util.format('[Transmission] code: %s, body: %s', resp.statusCode, JSON.stringify(body))
            ));
          } else {
            self.logger.info('Successfully removed: ', id);
            resolve(body);
          }
        });
      })
    });
  }


  status() {
    var self = this;
    return this.getSessionID().then(function (sessionid) {
      return new Promise(function (resolve, reject) {
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
        }, function (err, resp, body) {
          if (err || resp.statusCode !== 200 || body.result !== 'success') {
            reject(new Error(
              util.format('cant parse output from transmission: (Resp code: %s): %s \n%s', resp.statusCode, err, JSON.stringify(resp.body))
            ));
          } else {
            var ret = body.arguments.torrents.map(function (obj) {
              return {
                mediaType: self.getMediaTypeFromPath(obj['downloadDir']),
                sourceId: self.metadata.pluginId,
                id: obj.hashString,
                size: obj.totalSize,
                startDate: new Date((obj.startDate || obj.doneDate) * 1000), // this function expects milliseconds
                title: obj.name,
                downloadMechanism: 'torrent',
                hashString: obj.hashString,
                percentDone: obj.percentDone,
                rateDownload: obj.rateDownload,
                eta: obj.eta,
                isFinished: obj.isFinished,
                isStalled: obj.isStalled,
                source_data: obj
              };
            });

            resolve(ret);
          }
        });
      });
    });
  }


  getDownloadPath(mediaType) {
    return path.resolve(this.mediaTypePathMap[mediaType || 'default']);
  }

  getMediaTypeFromPath(path) {
    return _.invert(this.mediaTypePathMap)[path] || 'default';
  }


  getSessionID() {
    var self = this;
    return new Promise(function (resolve, reject) {
      request({
        url: self.getRpcUrl(),
        method: 'POST',
        auth: {
          user: self.get('transmissionUser'),
          pass: self.get('transmissionPass')
        }
      }, function (err, resp, body) {
        if (!err && resp.statusCode != 200) {
          resolve(resp.headers['x-transmission-session-id']);
        } else {
          var errMsg = util.format('[Transmission] cant get session id:', err);
          if (resp) {
            errMsg = util.format('[Transmission] cant parse output from transmission: (Resp code: %s): %s \n%s', resp.statusCode, err, resp.body);
          }
          reject(new Error(errMsg));
        }
      });
    });
  }




}



module.exports = TransmissionDownloader;
