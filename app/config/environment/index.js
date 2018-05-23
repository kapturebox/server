'use strict';

const path  = require('path');
const _     = require('lodash');
const os    = require('os');
const YAML  = require('yamljs');
const fs    = require('fs');

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV || 'development',

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'kapture-secret'
  },

  // where the system lives
  kaptureHost: 'localhost',
  
  // settings that will be used by ansible here
  settingsFileStore : path.join(process.env.KAPTURE_CONFIG_PATH || '.', 'settings.yml'),

  // where information about plugin download state is stored
  pluginStateStore: path.join(process.env.KAPTURE_PLUGIN_STORE || '.', 'pluginStateStore'),

  getUserSetting : getUserSetting,
  setUserSetting : setUserSetting,

  // if ngrok enabled and installed, can hit the /api/remote url to spin up a ngrok tunnel
  ngrokEnabled   : false,
  ngrokAuthToken : null,
  ngrokTimeout   : 60 * 60 * 1000,   // time in ms to keep ngrok alive

  // some user setting stuff
  userSettingDefaults: {
    system                  : {
      name                  : os.hostname()
    },
    userInfo                : {
      email                 : null
    },
    downloadPaths           : {
      root                  : path.join(process.env.KAPTURE_DOWNLOAD_PATH || '.' , 'downloads'), // /var/lib/kapture/
      movies                : 'movies',
      shows                 : 'tvshows',
      music                 : 'music',
      photos                : 'photos',
      default               : 'downloads'  
    },
    plugins                 : {
      // Migrated to each individual plugin's `defaultSettings`
      // TODO: perhaps we should instanciate those settings on initial startup?
    }
  },

  logger: require('../../logger')()
};




function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}





function getUserSetting( key ) {
  try {
    var json_obj = YAML.load( this.settingsFileStore );
  } catch( err ) {
    this.logger.warn( 'cant read settings file, setting defaults:', this.userSettingDefaults );

    fs.writeFileSync( 
      this.settingsFileStore, 
      YAML.stringify( this.userSettingDefaults, 8 )
    );

    return _.get( this.userSettingDefaults, key );
  }

  if( ! key ) {
    return json_obj;
  } else {
    if( typeof( key ) === 'string' && _.has( json_obj, key ) ) {
      return _.get( json_obj, key );
    } else {
      return null;
    }
  }
};

function setUserSetting( key, value ) {
  var root = this.getUserSetting();
  var toSave = root;

  if( typeof( key ) === 'object' ) {
    toSave = _.merge( root, key );
  } else if( typeof( key ) === 'string' ) {
    toSave = _.set( root, key, value );
  } else {
    throw new Error('cant change setting - need valid key in proper format (string or object)');
  }

  this.logger.debug( 'writing setting: %s = %s', key, 
    typeof toSave === 'object' ? JSON.stringify(toSave, null, 4) : toSave 
  );

  // save entire object to disk
  fs.writeFileSync( 
    this.settingsFileStore, 
    YAML.stringify( toSave, 8 ), 
    function( err ) {
      if( err ) {
        this.logger.warn( 'cant save user settings file: ', err );
        throw new Error( err );
      }
  });
}

// ==============================================
// Export the config object based on the NODE_ENV
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});  
  