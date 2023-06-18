'use strict';

const Blueprint = require('layer-gen-blueprint');
const isPackageMissing = require('../../lib/utilities/is-package-missing');

module.exports = class ServerBlueprint extends Blueprint {
  description = 'Generates a server directory for mocks and proxies.';

  normalizeEntityName() {}

  afterInstall(options) {
    let isMorganMissing = isPackageMissing(this, 'morgan');
    let isGlobMissing = isPackageMissing(this, 'glob');

    let areDependenciesMissing = isMorganMissing || isGlobMissing;
    let libsToInstall = [];

    if (isMorganMissing) {
      libsToInstall.push({ name: 'morgan', target: '^1.3.2' });
    }

    if (isGlobMissing) {
      libsToInstall.push({ name: 'glob', target: '^4.0.5' });
    }

    if (!options.dryRun && areDependenciesMissing) {
      return this.addPackagesToProject(libsToInstall);
    }
  }
};
