'use strict';

const fs     = require('fs');
const path   = require('path');
const _      = require('lodash');



module.exports = function makeDirs( config ) {
  var dirs = [
    config.getUserSetting('rootDownloadPath'),
    path.join( config.getUserSetting('rootDownloadPath'), config.getUserSetting('moviesPath') ),
    path.join( config.getUserSetting('rootDownloadPath'), config.getUserSetting('showsPath') ),
    path.join( config.getUserSetting('rootDownloadPath'), config.getUserSetting('musicPath') ),
    path.join( config.getUserSetting('rootDownloadPath'), config.getUserSetting('photosPath') ),
    path.join( config.getUserSetting('rootDownloadPath'), config.getUserSetting('defaultMediaPath') )
  ].map((d) => path.resolve(d));

  dirs.forEach(function(dir) {
    var parents = [];
    var parent = path.dirname( dir );

    while( parent !== '/' ) {
      if( ! _.includes( dirs, parent) ) {
        dirs.unshift( parent );
      }

      parent = path.dirname( parent );
    }
  });

  dirs.forEach(function( dir ) {
    if( !fs.existsSync( dir )) {
      config.logger.debug( 'making dir %s', dir );
      fs.mkdirSync( dir );
    }
  });
}
