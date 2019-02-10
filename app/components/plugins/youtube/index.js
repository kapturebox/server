

const util = require('util');
const youtubedl = require('youtube-dl');
const youtubesearch = require('youtube-search');
const youtubesdk = require('youtube-sdk');
const crypto = require('crypto');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const sanitize = require('sanitize-filename');
const Plugin = require('../../plugin_handler/base');

// TODO: move to settings and allow user to change
const youtubeSearchToken = 'AIzaSyAlhhTxfbaIjaCHi4qs5rl95PtpmcRTZTA';

const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch?v=%s';

// Used for scoring
// as of 2016-09-13, it's psy's gangnam style :)
const MAX_YOUTUBE_VIEWS = 2642 * 1000000;  // 2.6 billion
const SCORE_SCALING_FACTOR = 5;


class YoutubeSource extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'com_youtube',                  // Unique ID of plugin
      pluginName: 'Youtube',                    // Display name of plugin
      pluginTypes: ['source', 'downloader'],     // 'source', 'downloader', 'player'
      sourceTypes: 'adhoc',                     // 'adhoc', 'continuous'
      link: 'https://youtube.com',              // Link to provider site
      downloadProviders: 'youtube-dl',          // if plugin can also download, what
      // downloadMechanism can it download?
      description: 'You know what youtube is'   // Description of plugin provider
    };

    const defaultSettings = {
      enabled: true
      // TODO: api key needs to be stored here
    };

    super(metadata, defaultSettings);

    this.youtubesdk = new youtubesdk();
    this.youtubesdk.use(youtubeSearchToken);
  }


  // DEPRECATED, used in old v0
  download(item) {
    this.logger.info('[Youtube] downloading: [%s] %s', item.id, item.title);
    return this.url(item.downloadUrl);
  };

  downloadSlug(slug) {
    if (!slug.match(/[^?&"'>]+/)) {
      return Promise.reject(new Error(`invalid slug: ${slug}`))
    }

    const url = util.format(YOUTUBE_VIDEO_URL, slug);

    return this.url(url);
  }


  url(url) {
    var self = this;

    return new Promise(function (resolve, reject) {
      var kapResult = {};
      var lastTime = new Date();

      var video = youtubedl(url,
        ['--format=18'],
        { cwd: __dirname }
      );

      // Will be called when the download starts.
      video.on('info', function (retInfo) {
        kapResult = self.transformDownloadResult(retInfo);

        self.logger.info('[Youtube] download started: %s, (%s)', kapResult.filename, kapResult.size);

        try {
          video.pipe(fs.createWriteStream(kapResult.fullPath));
        } catch (err) {
          self.logger.error('[Youtube] cant download %s: %s', kapResult.id, err.toString());
        }

        // gets rid of annoying warnings from youtube-dl lib
        // delete kapResult['sourceData']['resolution'];

        resolve(kapResult);
      });

      // track position in file for use later
      video.on('data', function data(chunk) {
        if (isNaN(kapResult.pos)) {
          kapResult.pos = 0;
        }

        var timeDelta = new Date() - lastTime;
        lastTime = new Date();

        kapResult.pos += chunk.length;

        if (kapResult.size) {
          kapResult.percentDone = kapResult.pos / kapResult.size;
          kapResult.rateDownload = chunk.length / timeDelta;
          kapResult.eta = (kapResult.size - kapResult.pos) / kapResult.rateDownload;

          self.updateDownloadState(kapResult);
        }
      });

      // successful download
      video.on('end', function () {
        kapResult.isFinished = true;
        kapResult.isStalled = false;
        self.updateDownloadState(kapResult);
        self.logger.info('[Youtube] download complete: [%s] %s', kapResult.id, kapResult.title);
      });

      // unsuccessful download
      video.on('error', function (err) {
        reject(new Error(err));
      });

    });
  };

  transformDownloadResult(result) {
    var sha1 = crypto.createHash('sha1').update(result.id);

    return {
      sourceId: this.metadata.pluginId,
      sourceName: this.metadata.pluginName,
      downloadMechanism: this.metadata.downloadProviders,
      mediaType: 'video',
      hashString: sha1.digest('hex'),
      startDate: new Date().toISOString(),
      title: result.title,
      id: result.id,
      size: result.size,
      thumbnail: result.thumbnails[0].url || null,
      filename: result._filename,
      slug: Buffer.from(result.id).toString('base64'),
      fullPath: path.resolve(
        path.join(
          this.config.getUserSetting('downloadPaths.root'),
          this.config.getUserSetting('downloadPaths.default'),
          sanitize(result._filename)
      )),
      sourceData: result
    };

  }


  calculateScore(result) {
    return (result.statistics.viewCount / MAX_YOUTUBE_VIEWS) * SCORE_SCALING_FACTOR;
  }


  updateDownloadState(result) {
    return this.setState(result.id, result);
  }



  urlMatches(url) {
    return /^https?:\/\/(www\.|m\.)?youtube\.com\/.*/.test(url)
      || /^https?:\/\/youtu\.be\/.*/.test(url)
      || /^https?:\/\/(www\.)?vimeo\.com\//.test(url);
  };



  search(query) {
    var self = this;

    return new Promise(function (resolve, reject) {
      var opts = {
        maxResults: 30,
        key: youtubeSearchToken,
        type: 'video',
        order: 'relevance'
      };

      youtubesearch(query, opts, function (err, results) {
        if (err) {
          return reject(new Error(err.toString()));
        }

        self.logger.info('[%s] results: %d', self.metadata.pluginName, results.length);

        resolve(results);
      });
    }).then(function (ids) {
      return self.getMetadataFromResults(ids);
    }).then(function (itemsWithMetadata) {
      return self.transformSearchResults(itemsWithMetadata.items);
    });
  };


  getMetadataFromResults(results) {
    var self = this;

    return new Promise(function (resolve, reject) {
      var params = {
        part: 'snippet,statistics,contentDetails',
        id: results.map(function (e) {
          return e.id;
        }).join(',')
      };

      self.youtubesdk.get('videos', params, function (err, items) {
        if (err) {
          return reject(new Error(err.toString()));
        }
        resolve(items);
      })
    });

  }


  transformSearchResults(results) {
    var self = this;

    return results.map(function (e) {
      var sha1 = crypto.createHash('sha1').update(e.id);

      return {
        sourceId: self.metadata.pluginId,
        sourceName: self.metadata.pluginName,
        downloadMechanism: self.metadata.downloadProviders,
        mediaType: 'video',
        id: e.id,
        slug: Buffer.from(e.id).toString('base64'),
        description: e.snippet.description,
        title: e.snippet.title,
        thumbnail: e.snippet.thumbnails.default.url || null,
        uploaded: e.snippet.publishedAt,
        downloadUrl: util.format(YOUTUBE_VIDEO_URL, e.id),
        hashString: sha1.digest('hex'),
        size: self.calculateSize(e),
        score: self.calculateScore(e),
        sourceData: e
      }
    });
  }


  calculateSize(result) {
    // this is wrong but it's a baseline at least.
    const DURATION_REGEX = /PT((\d+)H)?((\d+)M)?((\d+)S)?/;
    const SD_BITS_PER_SEC = 1 * (1024) * 5;
    const HD_BITS_PER_SEC = 8 * (1024) * 5;

    const durMatches = DURATION_REGEX.exec(result.contentDetails.duration);
    const dimension = result.contentDetails.dimension;
    const definition = result.contentDetails.definition;

    try {
      const seconds = (parseInt(durMatches[2] || 0) * 60 * 60)
        + (parseInt(durMatches[4] || 0) * 60)
        + (parseInt(durMatches[6] || 0));

      const ret = seconds * (definition === 'hd' ? HD_BITS_PER_SEC : SD_BITS_PER_SEC);

      return ret;
    } catch (err) {
      this.logger.debug('name: %s, seconds: %d, definition: %s, ret: %d, durMatches: %s', result.snippet.title, seconds, definition, ret, durMatches);
      this.logger.warn('error calculating size:', result.contentDetails, err);
      return null;
    }
  }



  status() {
    return this.getState() || [];
  }


  // DEPRECATED
  remove(item, fromDisk) {
    return this.removeDownloadId(item.id, fromDisk);
  }



  removeDownloadId(id, deleteFromDisk) {
    var self = this;

    return new Promise(function (resolve, reject) {
      try {
        var canonical = self.getState(id);
        if (canonical === undefined) {
            let err = new Error(`cant find id [${id}] to delete in store: may have been already deleted`);
            err.statusCode = 404;
            throw err;
        }
      } catch (err) {
        return reject(err);
      }

      try {
        if (deleteFromDisk) {
          fs.unlinkSync(canonical.fullPath);
        }

        resolve(self.removeState(canonical.id));
      } catch (err) {
        return reject(new Error(err.toString()));
      }
    })
  }


  removeSlug(slug) {
    return Promise.reject(new Error('YoutubeSource: removeSlug() not yet implemented'));
  }


  downloadId(id) {
    return this.url(util.format(YOUTUBE_VIDEO_URL, id));
  }

  // slug contains the video id
  downloadSlug(id) {return this.downloadId(id)};

}


module.exports = YoutubeSource;
