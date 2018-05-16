'use strict';

const fs     = require('fs');
const path   = require('path');
const _      = require('lodash');



module.exports = function makeDirs( config ) {
  const rootPath = config.getUserSetting('downloadPaths.root');
  var dirs = [
    rootPath,
    path.join( rootPath, config.getUserSetting('downloadPaths.movies') ),
    path.join( rootPath, config.getUserSetting('downloadPaths.shows') ),
    path.join( rootPath, config.getUserSetting('downloadPaths.music') ),
    path.join( rootPath, config.getUserSetting('downloadPaths.photos') ),
    path.join( rootPath, config.getUserSetting('downloadPaths.default') )
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
