const fs = require('fs');
const yaml = require('yamljs');
const _ = require('lodash');
const path = require('path');

// set proper config dir, if needed
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || path.resolve(path.join(__dirname, 'config'));

// process.env['NODE_ENV'] = process.env.NODE_ENV || 'default';

const config = require('config');
const localSettingsFile = path.join(process.env.NODE_CONFIG_DIR, 'local.yml');


exports.localSettingsFile = localSettingsFile;
exports.has = config.has;

exports.get = (key) => {
  // it's not ideal to load this file every time we get a setting, but
  // there's a race condition with this function that causes a set operation
  // to complete after this function completes, but the returned object
  // seems to generally be correct.

  // TODO: dont load every time
  const obj = config.util.loadFileConfigs(process.env['NODE_CONFIG_DIR']);
  return key ? _.get(obj, key) : obj;
}

exports.set = (key, value) => {
  const original = this.get();
  var newObj = original;

  if( typeof( key ) === 'object' ) {
    newObj = _.merge(original, key);
    this.logger.debug( 'writing settings file: %s', JSON.stringify(newObj, null, 4) );
  } else if( typeof( key ) === 'string' ) {
    newObj = _.set( original, key, value );
    this.logger.debug( 'writing setting: %s = %s', key, value );
  } else {
    throw new TypeError('cant change setting - need valid key in proper format (string or object)');
  }

  // update file: config/local.yml
  fs.writeFileSync(localSettingsFile, yaml.stringify(newObj, 8));

  // reload config
  const conf = config.util.loadFileConfigs(process.env['NODE_CONFIG_DIR']);
  return config.util.toObject(conf);

}

exports.getUserSetting = this.get;

exports.setUserSetting = this.set;

exports.logger = require('../logger')();


// For testing
// exports.logger.debug(exports.get('system.name'));
// exports.logger.debug(exports.set('system.name', 'blahhh'));
// exports.logger.debug(exports.get('system.name'));
