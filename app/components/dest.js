const _ = require('lodash');
const config = require('../config');
const path = require('path');

const WHERES = {
  music: 'downloadPaths.music',
  photo: 'downloadPaths.photos',
  photos: 'downloadPaths.photos',
  tvshows: 'downloadPaths.shows',
  tvshow: 'downloadPaths.shows',
  series: 'downloadPaths.shows',
  movie: 'downloadPaths.movies',
  movies: 'downloadPaths.movies',
  other: 'downloadPaths.default',
  default: 'downloadPaths.default',
  auto: 'downloadPaths.default'
};

exports.determineDest = function(where) {
  if(!_.includes(Object.keys(WHERES), where)) {
    throw new Error(`key ${where} not valid target location`);
  }

  let subpath = config.get(WHERES[where]);
  let fullbase = path.join(config.get('downloadPaths.root'), subpath);

  return path.resolve(fullbase);
}
