'use strict';

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var util = require('util');
var base = require('./plugin_base');
var config = require('../../config/environment');

var PLUGIN_PREFIX = path.join(
  __dirname, '..', 'plugins'
);



module.exports = {
  getEnabledPlugins: function () {
    return _.filter(this.getAllPlugins(), function (p) {
      return p.isEnabled();
    });
  },

  getAllPlugins: function () {
    var self = this;
    return this.getAllPluginFiles().map(function (plugin_name) {
      var plugin = require('../plugins/' + plugin_name);
      util.inherits(plugin, base);

      plugin.prototype.pluginHandler = self;
      var newPluginObj = new plugin();

      return newPluginObj;
    })
  },

  getAllPluginFiles: function () {
    return fs.readdirSync(PLUGIN_PREFIX);
  },

  getPlugin: function (pluginId) {
    var result = _.find(this.getAllPlugins(), {
      metadata: {
        pluginId: pluginId
      }
    });

    if (!result) {
      let err = new Error(`no plugin found matching: ${pluginId}`);
      err.statusCode = 409;
      throw err;
    }

    return result;
  },


  getEnabledPluginsOfType: function (pluginType) {
    return _.filter(this.getEnabledPlugins(), function (p) {
      return _.includes(p.metadata.pluginTypes, pluginType);
    });
  },

  // gets first download provider that matches specific mechanism
  getDownloadMechanismProvider: function (downloadMechanism) {
    return _.find(this.getEnabledPlugins(), function (p) {
      return _.includes(p.metadata.pluginTypes, 'downloader')
        && _.includes(p.metadata.downloadProviders, downloadMechanism);
    });
  },

  getEnabledDownloaders: function () {
    return this.getEnabledPluginsOfType('downloader');
  },

  getEnabledSources: function () {
    return this.getEnabledPluginsOfType('source');
  },

  getEnabledSeriesProviders: function () {
    return this.getEnabledPluginsOfType('series');
  },



}
