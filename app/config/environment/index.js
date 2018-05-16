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
      'com_piratebay': {
        enabled: true
      },
      'com_youtube': {
        enabled: true
      },
      'info_showrss': {
        enabled: true
      },
      'com_transmissionbt': {
        enabled: true,
        transmission_host: process.env.TRANSMISSION_HOST || 'transmission',
        transmission_port: process.env.TRANSMISSION_PORT || 9091,
        transmission_user: process.env.TRANSMISSION_USER || 'admin',
        transmission_pass: process.env.TRANSMISSION_PASS || 'password',
      },
      'com_flexget': {
        enabled: true,

        flexgetCheckFrequency   : 15,

        flexget_host: process.env.FLEXGET_HOST || 'flexget',
        flexget_port: process.env.FLEXGET_PORT || 5050,

        // API Token has precedence over the username / password
        api_token:    process.env.FLEXGET_API_TOKEN || null,

        flexget_user: process.env.FLEXGET_USERNAME || 'flexget',
        flexget_pass: process.env.FLEXGET_PASSWORD || 'mySuperPassword',

      },
      'com_kapture_url': {
        enabled: true
      }
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
  var self = this;

  try {
    var json_obj = YAML.load( this.settingsFileStore );
  } catch( err ) {
    this.logger.warn( 'cant read settings file, setting defaults:', this.userSettingDefaults );

    fs.writeFileSync( this.settingsFileStore, YAML.stringify( this.userSettingDefaults, 8 ));

    return _.get( this.userSettingDefaults, key );
  }

  if( ! key ) {
    return json_obj;
  } else {
    if( typeof( key ) == 'string' && _.has( json_obj, key ) ) {
      return _.get( json_obj, key );
    } else {
      return null;
    }
  }
};

function setUserSetting( key, value ) {
  var orig = this.getUserSetting();
  var toSave = orig;

  this.logger.debug( 'setting: %s = %s', key, value || 'obj' );

  if( typeof( key ) === 'object' ) {
    this.logger.debug( 'merging obj: ', key, orig );
    toSave = _.merge( orig, key );
  } else if( typeof( key ) === 'string' ) {
    toSave = _.set( orig, key, value );
  }

  this.logger.debug( 'writing setting:', toSave );

  fs.writeFile( this.settingsFileStore, YAML.stringify( toSave, 8 ), function( err ) {
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
  