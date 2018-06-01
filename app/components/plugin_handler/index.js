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

const PLUGIN_REQUIREMENTS = {
  downloader: {
    functions: ['downloadSlug', 'downloadId', 'status', 'removeId', 'removeSlug'],
  },
  trending: {
    functions: ['trending', 'trendingInfo']
  },
  source: {
    functions: ['search']
  },
  series: {
    functions: ['addId', 'removeId', 'getEnabledSeries']
  }
}



module.exports = {
  verifyPlugin: function(plugin) {
    let types = plugin.metadata.pluginTypes;

    if(!Array.isArray(types))
      types = [types];

    types.forEach((t) => {
      const funcs = PLUGIN_REQUIREMENTS[t].functions.map((f) => {
        if(typeof(plugin[f]) !== 'function')
          return f;

        return null;
      })
      .reduce((prev, cur) => {
        if(cur !== null) 
          prev.push(cur);
        return prev;
      }, []);

      if(funcs.length) {
        throw new Error(`PluginError: ${plugin.metadata.pluginId} missing functions: ${funcs.join(',')}`);
      }
    });
  },

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

      self.verifyPlugin(newPluginObj);

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
      err.statusCode = 400;
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
