'use strict';

const path = require('path');

const emberBlueprintsFolder = path.dirname(require.resolve('ember-cli-blueprints'));
module.exports = function emberBlueprint(name) {
  return path.resolve(path.join(emberBlueprintsFolder, 'blueprints', name));
};
