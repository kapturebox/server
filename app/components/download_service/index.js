var _ = require('lodash');
var request = require('request');
var Promise = require('bluebird');


var plugins = require('../../components/plugin_handler');
var config = require('../../config/environment');


// DEPRECATE THIS ENTIRE SERVICE

/////////////////////////////////////////
// DownloadService
// Intended to be an abstraction to deal with
// all the plugins in the system
/////////////////////////////////////////

module.exports = {

  // remove a specific item from our list of downloads
  // takes a item of the download, and whether to delete the file from disk or not
  // returns promise to caller
  remove: function (item, deleteOnDisk) {
    config.logger.debug('[DownloadService] removing:', item);
    var provider = plugins.getDownloadMechanismProvider(item.downloadMechanism);

    if (_.isEmpty(provider) || typeof (provider.download) === 'undefined') {
      return Promise.reject(new Error('No enabled remove method for: ' + item.downloadMechanism));
    }

    config.logger.debug('[DownloadService] using plugin: %s', provider.toString());

    return provider.remove(item, deleteOnDisk);
  },



  // add a specific item to whatever download queue it needds to be downloaded with
  // expects a promise back from 'download' function
  // returns promise to caller
  add: function (item) {
    config.logger.debug('[DownloadService] adding:', item);
    var provider = plugins.getDownloadMechanismProvider(item.downloadMechanism);

    if (_.isEmpty(provider) || typeof (provider.download) === 'undefined') {
      return Promise.reject(new Error('No enabled download method for: ' + item.downloadMechanism));
    }

    config.logger.debug('[DownloadService] using plugin: %s', provider.toString());

    return provider.download(item);
  },



  // get status of all downloads in system
  // returns promise with consildated array of elements of known downloads
  status: function () {
    config.logger.debug('[DownloadService] getting statuses..');

    var statusPromises = plugins
      .getEnabledDownloaders()
      .map((p) => {
        return p.status().map((s) => {
          // get standardized ID for each plugin
          const sid = Buffer.from(`${p.metadata.pluginId}:${s.id}`).toString('base64');
          return Object.assign(s, {id: sid});
        })
      })

    return Promise
      .all(statusPromises)
      .then(function (statuses) {
        return statuses.reduce(function (last, cur) {
          return _.concat(last, cur);
        }, []);
      });
  }
};
