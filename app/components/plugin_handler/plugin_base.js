'use strict';

var fs      = require('fs');
var persist = require('node-persist');
var util    = require('util');
var path    = require('path');
var config  = require('../../config/environment');

var settingsFile     = config.settingsFileStore;
var stateStorePath   = config.pluginStateStore;


// constructor function for all plugins (After metadata has been set)
var Plugin = function() {
  this.config    = config;
  this.logger    = config.logger;
  this.configKey = 'plugins[\'' + this.metadata.pluginId + '\']';

  try {
    this.stateStore = persist.create({
      dir: path.join( stateStorePath, this.metadata.pluginId || 'base' ),
      interval: 1000 // 2s save to disk interval
    });

    this.stateStore.initSync();
  } catch( err ) {
    this.logger.error( 'unable to init state store: %s', err.toString() );
  }

  // init settings if not already present
  if( ! this.config.getUserSetting(this.configKey) ) {
    this.config.setUserSetting(this.configKey, this.defaultSettings || {});
  }

  return this;
}


Plugin.prototype.getAllSettings = function( ) {
  return this.config.getUserSetting( this.configKey );
}


Plugin.prototype.get = function( key ) {
  const userKey = this.configKey + '.' + key;
  return this.config.getUserSetting( userKey );
}



Plugin.prototype.set = function( key, value ) {
  const userKey = this.configKey + '.' + key;
  return this.config.setUserSetting( userKey, value );
}



Plugin.prototype.setState = function( key, value ) {
  return this.stateStore.setItemSync( key, value );
}



Plugin.prototype.getState = function( key ) {
  if( ! key ) { // then return array of all
    return this.stateStore.values();
  } else {
    return this.stateStore.getItemSync( key );
  }
}


Plugin.prototype.removeState = function( key ) {
  return this.stateStore.removeItemSync( key );
}



Plugin.prototype.toString = function() {
  return util.format( '%s', this.metadata.pluginName );
}


Plugin.prototype.isEnabled = function() {
  return this.get( 'enabled' ) || false;
};


Plugin.prototype.enable = function() {
  return this.set( 'enabled', true );
};


Plugin.prototype.disable = function() {
  return this.set( 'enabled', false );
};


module.exports = Plugin;
