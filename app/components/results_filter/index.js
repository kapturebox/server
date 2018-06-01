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
  if( ! filterStr ) {
    return objects;
  }

  var filterObj = {};
  
  filterStr.split(';').forEach((d) => {
    const splitted = d.split(':');

    // this will convert strings to int, if possible.  clearly wont work with floats
    // TODO: handle floats too
    val = isNaN(parseInt(splitted[1])) ? splitted[1] : parseInt(splitted[1]);

    filterObj[splitted[0]] = val;
  });

  if(Array.isArray(objects)) {
    return _.filter(objects, filterObj);
  } else if(typeof(objects) === 'object') {
    var result = {};

    Object.keys(objects).forEach((k) => {
      result[k] = _.filter(objects[k], filterObj);
    });

    return result;
  } else {
    return objects;
  }
}
