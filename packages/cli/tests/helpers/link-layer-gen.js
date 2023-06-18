'use strict';

const fs = require('fs-extra');
const path = require('path');

module.exports = async function linkLayerGen() {
  await fs.mkdir('node_modules');
  return fs.symlink(path.join(__dirname, '..', '..'), './node_modules/layer-gen');
};
