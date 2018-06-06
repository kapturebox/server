'use strict';

const fs     = require('fs');
const path   = require('path');
const _      = require('lodash');



module.exports = function makeDirs( config ) {
  const rootPath = config.get('downloadPaths.root');
  var dirs = [
    rootPath,
    path.join( rootPath, config.get('downloadPaths.movies') ),
    path.join( rootPath, config.get('downloadPaths.shows') ),
    path.join( rootPath, config.get('downloadPaths.music') ),
    path.join( rootPath, config.get('downloadPaths.photos') ),
    path.join( rootPath, config.get('downloadPaths.default') )
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
