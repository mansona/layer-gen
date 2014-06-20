'use strict';

module.exports = function(name) {
  if (['test', 'ember', 'vendor'].indexOf(name) > -1) { return false; }
  if (name.indexOf('.') > -1) { return false; }

  return true;
};
