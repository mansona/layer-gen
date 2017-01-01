var Blueprint = require('../../lib/models/blueprint');

module.exports = {
  description: 'Generates a relative proxy to another server.',

  anonymousOptions: [
    'local-path',
    'remote-url',
  ],

  locals(options) {
    var proxyUrl = options.args[2];
    return {
      path: '/' + options.entity.name.replace(/^\//, ''),
      proxyUrl,
    };
  },

  beforeInstall(options) {
    var serverBlueprint = Blueprint.lookup('server', {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
    });

    return serverBlueprint.install(options);
  },

  afterInstall() {
    return this.addPackagesToProject([
      { name: 'http-proxy', target: '^1.1.6' },
    ]);
  },
};
