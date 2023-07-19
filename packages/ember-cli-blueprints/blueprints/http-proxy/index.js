'use strict';

const Blueprint = require('layer-gen-blueprint');
const path = require('path');

module.exports = class HttpProxyBlueprint extends Blueprint {
  description = 'Generates a relative proxy to another server.';

  anonymousOptions = ['local-path', 'remote-url'];

  locals(options) {
    let proxyUrl = options.args[2];
    return {
      path: `/${options.entity.name.replace(/^\//, '')}`,
      proxyUrl,
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

  afterInstall() {
    return this.addPackagesToProject([{ name: 'http-proxy', target: '^1.1.6' }]);
  }
};
