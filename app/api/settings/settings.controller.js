'use strict';

var _               = require('lodash');
var config          = require('../../config/environment');



// [v0] store setting
// DEPRECATE
exports.postSettings = function( req, res, next ) {
  try {
    config.setUserSetting( req.body );
    return res.status(200).send();
  } catch( err ) {
    return next(err);
  }
};

// get settings from ansible
exports.getSettings = function( req, res, next ) {
  res.status(200).json( config.getUserSetting() );
};

exports.getSetting = function( req, res, next ) {
  const val = config.getUserSetting(req.params.key);
  if( val ) {
    res.status(200).json( {'value': val} );
  } else {
    res.status(404).send();
  }
}

// given a body of settings, update all settings to match that
exports.putSettings = function( req, res, next ) {
  config.setUserSetting(req.body);
  return res.status(202).json(config.getUserSetting());
}

// given a body with a single (or muptiple) settings changed, change just those
exports.patchSettings = function( req, res, next ) {
  config.setUserSetting( req.body );
  return res.status(202).json(config.getUserSetting());
}
