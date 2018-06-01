'use strict';

var Promise = require('bluebird');
var request = require('request');
var util    = require('util');
var _       = require('lodash');
var Buffer  = require('buffer').Buffer;
var YAML    = require('yamljs');


// standard plugin metadata, and some additional flexget properties
var FlexgetDownloader = function( options ) {
  var self = this;

  this.metadata = {
    pluginId: 'com_flexget',                 // Unique ID of plugin
    pluginName: 'Flexget',                   // Display name of plugin
    pluginTypes: 'downloader',               // 'source', 'downloader', 'player'
    sourceTypes: 'continuous',               // 'adhoc', 'continuous'
    link: 'https://transmissionbt.com',      // Link to provider site
    requires: ['com_transmissionbt'],        // Dependency plugin
    downloadProviders: 'flexget',            // if plugin can also download, what
                                             // downloadMechanism can it download?
    description: 'Full featured continuous downloader' // Description of plugin provider
  };

  this.defaultSettings = {
      enabled: true,

      flexgetCheckFrequency   : 15,

      flexgetHost: process.env.FLEXGET_HOST || 'flexget',
      flexgetPort: process.env.FLEXGET_PORT || 5050,

      // API Token has precedence over the username / password
      apiToken:    process.env.FLEXGET_API_TOKEN || null,

      flexgetUser: process.env.FLEXGET_USERNAME || 'flexget',
      flexgetPass: process.env.FLEXGET_PASSWORD || 'mySuperPassword',
  };
  
  FlexgetDownloader.super_.apply( this, arguments );

  this.flexgetConfig = {
    web_server: {
      bind: '0.0.0.0',
      port: 5050,
      web_ui: this.config.env  === 'production' ? false : true
    },
  };

  this.schedulerConfig = {
    schedules: [{
      tasks: '*',    
      interval: {
        minutes: this.get('flexgetCheckFrequency')
      },
    }]
  };

  // settings in plugin config file
  this.getApiToken      = this.get.bind( this, 'apiToken' );
  this.getUsername      = this.get.bind( this, 'flexgetUser' );
  this.getPassword      = this.get.bind( this, 'flexgetPass' );
  this.getFlexgetHost   = this.get.bind( this, 'flexgetHost' );
  this.getFlexgetPort   = this.get.bind( this, 'flexgetPort' );
  
  this.getFlexgetApiUrl = function( path ) {
    return util.format( 'http://%s:%s/api/%s', 
      self.getFlexgetHost() || 'localhost', 
      self.getFlexgetPort() || '5050', 
      path || '' );
  }

  this.getAuthorization = function() {
    if( self.getApiToken() ) {
      return {
        headers: { 
          'Authorization': util.format( 'Token %s', self.getApiToken() ) 
        }
      }
    } else {
      return {
        auth: {
          user: self.getUsername(),
          pass: self.getPassword()
        }
      }
    }
  };

  return this;
}


// DEPRECATED
// takes an item provided by the search sources, and sends it to the search source to add
// state to that plugin, then it kicks off a 'update' job to the flexget server to update teh 
// state of the config on that end.
FlexgetDownloader.prototype.download = function( item ) {
  var self = this;
  return new Promise(function( resolve, reject ) {
    var destPlugin = self.pluginHandler.getPlugin( item.sourceId );

    // maintain state in individual plugin
    return destPlugin
      .add(item)
      .then(getModelsAndUpdateFlexget);
  });
}

FlexgetDownloader.prototype.downloadId = function( id ) {
  return Promise.reject(new Error('Flexget: downloadId() not yet implemented'));
}


// Slugs in the case of a flexget item are defined as "{pluginId}:{entryId}"
// due to each plugin requiring a different configuration
function parseSlug(slug) {
  let matches = slug.match(/^(\w+):([0-9]+)$/);
  if(!matches) {
    let err = new Error(`invalid slug: ${slug}`);
    err.statusCode = 400;
    throw err;
  }

  return {
    pluginId: matches[1],
    entryId: matches[2]
  }
}

FlexgetDownloader.prototype.downloadSlug = function(slug) {
  const pSlug = parseSlug(slug);
  const plugin = this.pluginHandler.getPlugin(pSlug.pluginId);

  return plugin
    .downloadId(pSlug.entryId);
}

// updates the entire config file on the flexget side with given json object
// this focuses mostly on the sending to the server
FlexgetDownloader.prototype.updateConfig = function( fullFlexgetConfig ) {
  var self = this;
  return new Promise(function( resolve, reject ) {
    self.logger.debug( 'updating flexget config with:', fullFlexgetConfig );
    self.logger.debug( 'using api token: ', self.getApiToken() );

    var base64yaml = new Buffer( YAML.stringify( fullFlexgetConfig, 8 ) ).toString('base64');

    request(
      Object.assign(
        self.getAuthorization(), {
          url:     self.getFlexgetApiUrl( 'server/raw_config/' ),
          method:  'POST',
          json:    true,
          timeout: 10 * 1000, // in ms
          body:    {
            raw_config: base64yaml
          }
      }), function( err, resp, body ){
        if( err || (resp.statusCode !== 200 && resp.statusCode !== 201) ) {
          return reject( new Error( self.flexgetError( err, resp, body ) ) );
        }

        resolve( body );
      });
  });
}


// returns a quality error message based on the api docs that flexget provides
FlexgetDownloader.prototype.flexgetError = function( err, resp, body ) {
  if( err ) {
    return err.toString();
  }

  var code = parseInt( body.code || resp.statusCode || 0 );

  switch( code ) {
    case 401:
      return 'access denied to flexget api';
    case 422:
      return util.format( 'flexget api: validation error: %s', JSON.stringify( body.validation_errors ) );
    default:
      return util.format( 'flexget api code %s, message: %s', resp.statusCode, body.message || 'none' );
  }
}



// DOESNT QUITE WORK YET DUE TO BUG IN FLEXGET, so update entire config:
// https://github.com/Flexget/Flexget/issues/1383
FlexgetDownloader.prototype.updateTask = function( taskConfig ) {
  var self = this;
  return new Promise(function( resolve, reject ) {
    // send request with updated task to flexget daemon
    self.logger.debug( 'updating flexget task with %s config', taskConfig.name, taskConfig )

    request(
      Object.assign(
        self.getAuthorization(), 
        {
          url:     self.getFlexgetApiUrl( 'tasks/' ),
          method:  'POST',
          json:    true,
          body:    taskConfig
      }), 
      function( err, resp, body ){
        if( err || (resp.statusCode !== 200 && resp.statusCode !== 201) ) {
          return reject( new Error( self.flexgetError( err, resp, body ) ) );
        }

        resolve( body );
      });
  });
}

// TODO: Dynamic way of getting authorization headers based on token or user / pass
// details here: https://github.com/gaieges/docker-flexget

// takes the item as generated in search, and removes from list (with delete option if present)
FlexgetDownloader.prototype.removeSlug = function( slug, deleteOnDisk ) {
  const self = this;
  const pSlug = parseSlug(slug);
  const destPlugin  = this.pluginHandler.getPlugin(pSlug.sourceId);

  // maintain state in individual plugin
  return destPlugin
    .removeId(pSlug.entryId)
    .then(this.getModelsAndUpdateFlexget);
}

FlexgetDownloader.prototype.removeDownloadId = function(id, deleteOnDisk) {
  return Promise.reject(new Error('Flexget: removeDownloadId: not yet implemented'));
}

// does nothing really but is here because it's offically a 'downloader'.  may at some point
// turn this into report status of each series
FlexgetDownloader.prototype.status = function( ) {
  return Promise.resolve([]); // doesnt actually give status updates, comes from transmission
}

// reaches out to all of the possible 'continuous' plugins and if
// they have the proper flexget functions, will get that model and
// add it to the config
FlexgetDownloader.prototype.getModelsAndUpdateFlexget = function() {
  this.logger.debug('[flexget] updating model..');

  const flexgetPlugins = _.filter(
    this.pluginHandler.getEnabledPluginsOfType('series'), 
    (p) => {
      return typeof p.flexgetTaskModel === 'function'
        &&   typeof p.flexgetTemplateModel === 'function'
    });

  const fullConfig  = _.extend( {}, 
    this.flexgetConfig, 
    this.schedulerConfig, 
    {
      templates: flexgetPlugins
        .map((p) => p.flexgetTemplateModel())
        .reduce((prev, cur) => _.merge(prev, cur),{}),
      tasks: flexgetPlugins
        .map((p) => p.flexgetTaskModel())
        .reduce((prev, cur) => _.merge(prev, cur),{}),
    }
  );


  return this.updateConfig(fullConfig)
} 





module.exports = FlexgetDownloader;
