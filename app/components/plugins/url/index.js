const request = require('request');
const crypto = require('crypto');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const sanitize = require('sanitize-filename');
const Promise = require('bluebird');
const Url = require('url');
const Plugin = require('../../plugin_handler/base');


class KaptureURLHandler extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'com_kapturebox_url',    // Unique ID of plugin
      pluginName: 'Kapture URL Handler', // Display name of plugin
      pluginTypes: ['downloader'],       // 'source', 'downloader', 'player'
      sourceTypes: 'adhoc', // 'adhoc', 'continuous'
      link: 'http://kapturebox.com', // Link to provider site
      downloadProviders: 'url', // if plugin can also download, what
      // downloadMechanism can it download?
      description: 'Simple URL download handler' // Description of plugin provider
    };

    const defaultSettings = {
      enabled: true
    };

    super(metadata, defaultSettings);
  }


  // entry point from /api/download url takes us here, then we find the right
  // plugin to handle the specific URL.
  // if all else fails, we just store the file on the system (ideally with some 
  // direction as to where), using the url function in this object
  download(item) {
    var url = item.url;

    var pluginsToSearch = plugins.getEnabledPlugins();
    var validDownloaders = _.filter(pluginsToSearch, function (p) {
      return typeof (p.urlMatches) === 'function' && p.urlMatches(url);
    });

    if (_.isEmpty(validDownloaders)) {
      var selectedDownloader = this;
    } else {
      var selectedDownloader = _.first(validDownloaders);
    }

    this.logger.info('[KaptureURLHandler] downloading URL via plugin %s: %s', selectedDownloader, url);

    // should return a promise
    return selectedDownloader.url(url);
  };




  url(url, where) {
    var self = this;

    return new Promise(function (resolve, reject) {
      // initially get content-type to try to figure out what type it is
      request.head(url)
        .on('error', reject)
        .on('response', function (head) {
          self.logger.debug('head:', head.headers);

          const dest = where ||
            self.assumeDownloadPathFromCtype(head.headers['content-type']);

          const fullDestPath = self.getDestPath(url, dest);

          try {
            // goes off and does its thing asyncronously
            // we do this via try/catch because we want a quick response to say
            // download started, not wait til it's finished to report back
            self.handleMediaType(url, head, fullDestPath);
          } catch (err) {
            return reject(err);
          }

          // send back to client that download is in progress, then find status 
          // via normal download status method
          return resolve({
            url: url,
            contentType: head.headers['content-type'],
            destName: dest,
            fullDestPath: fullDestPath
          });
        });
    });
  }



  // likely an rss feed of elements, handle continuously with flexget
  handleXml(url, head, dest) {
    this.logger.warn('[KaptureURLHandler.handleXml] not yet implemented: %s', url);
    throw new Error('rss feature not yet implemented');
  }



  handleLastResort(url, head, dest) {
    var self = this;

    new Promise(function (resolve, reject) {
      var contentType = head.headers['content-type'];
      var sha1 = crypto.createHash('sha1')
        .update(`${url}+${dest}`)
        .digest('hex');

      var state = {
        sourceId: self.metadata.pluginId,
        sourceName: self.metadata.pluginName,
        title: self.getFilename(url),
        downloadMechanism: self.metadata.downloadProviders,
        fullPath: dest,
        pos: 0,
        eta: -1,
        percentDone: 0,
        lastUpdated: new Date(),
        size: parseInt(head.headers['content-length'] || -1),
        rateDownload: 0,
        url: url,
        isFinished: false,
        isStalled: false,
        id: sha1,
        hashString: sha1
      };

      self.logger.debug('[KaptureURLHandler.lastResort] storing %s of type %s in %s', url, contentType, dest);

      request(url)
        .on('data', function (chunk) {
          var timeDelta = new Date() - state.lastUpdated;

          state.pos += chunk.length;

          state.percentDone = state.pos / state.size;
          state.rateDownload = chunk.length / timeDelta;
          state.eta = (state.size - state.pos) / state.rateDownload;
          state.lastUpdated = new Date();

          self.updateDownloadState(state);
        })
        .on('end', function () {
          state.isFinished = true;
          state.isStalled = false;

          resolve(self.updateDownloadState(state));
        })
        .on('error', function (err) {
          state.isFinished = false;
          state.isStalled = true;
          state.isFailed = true;

          self.updateDownloadState(state);

          reject(err);
        })
        .pipe(fs.createWriteStream(dest)); // send to default
    });
  }


  // nothing for now 
  status(id) {
    return this.getState(id) || [];
  }

  // DEPRECATED
  remove(item, fromDisk) {
    return this.removeDownloadId(id, fromDisk);
  }



  removeDownloadId(id, fromDisk) {
    const self = this;
    const infoObj = this.getState(id);

    return new Promise((resolve, reject) => {
      if (infoObj === undefined) {
        return reject(new Error('cant find item to delete in store'));
      }

      if (!infoObj.isFinished) {
        return reject(new Error('download is not finished, wait for completion..'));
      }

      if (fromDisk) {
        fs.unlinkSync(infoObj.fullPath);
      }

      resolve(self.removeState(infoObj.id));
    });
  }


  removeSlug(slug) {
    return Promise.reject(new Error('KaptureURLHandler: removeSlug() not yet implemented'));
  }


  downloadId(id) {
    return Promise.reject(new Error('KaptureURLHandler: downloadId() not yet implemented'));
  }


  downloadSlug(slug, where) {
    return this.url(slug, where);
  }

  ///////////
  // HELPERS
  ///////////
  updateDownloadState(result) {
    return this.setState(result.id, result);
  }


  getDestPath(url, dest) {
    return path.resolve(
      path.join(
        this.config.getUserSetting('downloadPaths.root'),
        this.config.getUserSetting('downloadPaths.' + (dest || 'default')),
        this.getFilename(url)
      )
    );
  }

  getFilename(url) {
    const urlObj = Url.parse(url);

    if (/https?:/.test(urlObj.protocol)) {
      return sanitize(
        _.last(urlObj.pathname.split('/')) // grabs filename of url 
      );
    } else {
      return undefined;
    }
  }


  handleMediaType(url, head, dest) {
    var cTypeHeader = head.headers['content-type'];
    var cType = _.first(cTypeHeader.split(';'));

    switch (cType) {
      case 'text/xml':
        return this.handleXml(url, head, dest);
      default:
        return this.handleLastResort(url, head, dest);
    }
  }


  assumeDownloadPathFromCtype(contentType) {
    if (/^image\/.*/.test(contentType)) {
      return 'photos';
    } else if (/^audio\/.*/.test(contentType)) {
      return 'music';
    } else if (/^video\/.*/.test(contentType)) {
      return 'movies';
    } else if (/^(text|application)\/.*/.test(contentType)) {
      return 'default';
    } else {
      return 'default';
    }
  }
}


module.exports = KaptureURLHandler;
