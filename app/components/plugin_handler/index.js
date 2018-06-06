const _ = require('lodash');
const plugins = require('./plugins');

exports.getEnabledPlugins = function () {
  return _.filter(plugins, function (p) {
    return p.isEnabled();
  });
},

exports.getAllPlugins = function () {
  return plugins;
},

exports.getPlugin = function (pluginId) {
  var result = _.find(plugins, {
    metadata: {
      pluginId: pluginId
    }
  });

  if (!result) {
    let err = new Error(`no plugin found matching: ${pluginId}`);
    err.statusCode = 400;
    throw err;
  }

  return result;
},


exports.getEnabledPluginsOfType = function (pluginType) {
  return _.filter(this.getEnabledPlugins(), function (p) {
    return _.includes(p.metadata.pluginTypes, pluginType);
  });
},

// gets first download provider that matches specific mechanism
exports.getDownloadMechanismProvider = function (downloadMechanism) {
  const result = _.find(this.getEnabledPlugins(), function (p) {
    return _.includes(p.metadata.pluginTypes, 'downloader')
        && _.includes(p.metadata.downloadProviders, downloadMechanism);
  });

  if( ! result ) {
    let err = new Error(`no download method: ${downloadMechanism}`);
    err.statusCode = 400;
    throw err;
  }

  return result;
},

exports.getEnabledDownloaders = function () {
  return this.getEnabledPluginsOfType('downloader');
},

exports.getEnabledSources =function () {
  return this.getEnabledPluginsOfType('source');
},

exports.getEnabledSeriesProviders = function () {
  return this.getEnabledPluginsOfType('series');
}
