'use strict';

const Blueprint = require('layer-gen-blueprint');
const isPackageMissing = require('../../lib/utilities/is-package-missing');
const path = require('path');

module.exports = class HttpMock extends Blueprint {
  description = 'Generates a mock api endpoint in /api prefix.';

  anonymousOptions = ['endpoint-path'];

  locals(options) {
    return {
      path: `/${options.entity.name.replace(/^\//, '')}`,
    };
  }

  beforeInstall(options) {
    let serverBlueprint = Blueprint.lookup(path.resolve(path.join(__dirname, '../server')), {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
    });

    return serverBlueprint.install(options);
  }

  afterInstall(options) {
    if (!options.dryRun && isPackageMissing(this, 'express')) {
      return this.addPackagesToProject([{ name: 'express', target: '^4.8.5' }]);
    }
  }
};
