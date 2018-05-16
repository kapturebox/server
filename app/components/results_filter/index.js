const _ = require('lodash');

/**
 * Takes a filter in the form of `key1:value1;key2:value` and applies
 * that to all of the objects in the results passed along.  It filters
 * out those that don't match ALL of the key/value pairs
 * 
 * @param {Object} objects     results object
 * @param {String} filterStr   string in the format of 
 *      `key1:value1;key2:value2` that objects must match
 */
module.exports = function resultsFilter(objects, filterStr) {
  var filterObj = {};
  
  filterStr.split(';').forEach((d) => {
    const res = d.split(':');
    filterObj[res[0]] = res[1];
  });

  return _.filter(objects, filterObj)
}
