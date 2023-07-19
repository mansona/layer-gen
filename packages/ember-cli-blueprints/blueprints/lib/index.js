'use strict';

const Blueprint = require('layer-gen-blueprint');
const fs = require('fs-extra');

module.exports = class LibBlueprint extends Blueprint {
  description = 'Generates a lib directory for in-repo addons.';

  normalizeEntityName(name) {
    return name;
  }

  beforeInstall() {
    // make sure to create `lib` directory
    fs.mkdirsSync('lib');
  }
};
