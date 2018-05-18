'use strict';

const _ = require('lodash');
const search = require('./search');
const config = require('../../config/environment');
const filterResults = require('../../components/results_filter');


// Get list of searchs
exports.search = function( req, res, next ) {
  const query = req.query.q;
  const filter = req.query.filter;

  config.logger.info( 'search query: %s, filtering on %s', query, filter );

  search(query)
    .then(function(results) {
      return filter ? filterResults(results, filter) : results;
    }
    ).then(function(results) {
      return res.status(200).json( results );
    })
    .catch(function(err) {
      config.logger.error('cant get results:', err);
      return next(err);
    });
};
