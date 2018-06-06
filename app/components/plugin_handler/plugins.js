const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const util = require('util');
const base = require('./base');
const config = require('../../config');

const PLUGIN_PREFIX = path.join(
  __dirname, '..', 'plugins'
);

const PLUGIN_REQUIREMENTS = {
  downloader: {   // ie transmission, flexget
    functions: ['downloadSlug', 'status', 'removeDownloadId', 'removeSlug']
  },
  trending: {     // ie trakt.tv , billboard
    functions: ['trending', 'trendingInfo']
  },
  source: {       // ie youtube, tpb
    functions: ['search', 'downloadId']
  },
  series: {       // ie showrss
    functions: ['enableId', 'disableId', 'getEnabledSeries']
  }
}


function instanciateAllPlugins() {
  return fs.readdirSync(PLUGIN_PREFIX).map(function (plugin_name) {
    var plugin = require('../plugins/' + plugin_name);
    util.inherits(plugin, base);

    var newPluginObj = new plugin();

    verifyPlugin(newPluginObj);

    return newPluginObj;
  })
}

function verifyPlugin(plugin) {
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
}

const PLUGINS = instanciateAllPlugins();

module.exports = PLUGINS;
