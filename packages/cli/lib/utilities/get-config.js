'use strict';

let Yam = require('yam');

function generateConfig() {
  return new Yam('ember-cli', {});
}

module.exports = function getConfig(override) {
  if (override) {
    return override;
  }

  return generateConfig();
};
