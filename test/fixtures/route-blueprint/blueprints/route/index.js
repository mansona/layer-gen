'use strict';

const path = require('path');
// eslint-disable-next-line n/no-extraneous-require
const stringUtil = require('ember-cli-string-utils');

module.exports = {
  description: 'Generates a route and a template, and registers the route with the router.',

  shouldTransformTypeScript: true,

  availableOptions: [
    {
      name: 'path',
      type: String,
      default: '',
    },
    {
      name: 'skip-router',
      type: Boolean,
      default: false,
    },
    {
      name: 'reset-namespace',
      type: Boolean,
    },
  ],

  init() {
    this._super && this._super.init.apply(this, arguments);
  },

  fileMapTokens() {
    return {
      __name__(options) {
        if (options.pod) {
          return 'route';
        }
        return options.locals.moduleName;
      },
      __path__(options) {
        if (options.pod) {
          return path.join(options.podPath, options.locals.moduleName);
        }
        return 'routes';
      },
      __templatepath__(options) {
        if (options.pod) {
          return path.join(options.podPath, options.locals.moduleName);
        }
        return 'templates';
      },
      __templatename__(options) {
        if (options.pod) {
          return 'template';
        }
        return options.locals.moduleName;
      },
      __root__(options) {
        if (options.inRepoAddon) {
          return path.join('lib', options.inRepoAddon, 'addon');
        }

        if (options.inDummy) {
          return path.join('tests', 'dummy', 'app');
        }

        if (options.inAddon) {
          return 'addon';
        }

        return 'app';
      },
    };
  },

  locals(options) {
    let moduleName = options.entity.name;
    let rawRouteName = moduleName.split('/').pop();
    // let emberPageTitleExists = 'ember-page-title' in options.project.dependencies();
    let emberPageTitleExists = false;
    let hasDynamicSegment = options.path && options.path.includes(':');

    if (options.resetNamespace) {
      moduleName = rawRouteName;
    }

    return {
      moduleName: stringUtil.dasherize(moduleName),
      routeName: stringUtil.classify(rawRouteName),
      addTitle: emberPageTitleExists,
      hasDynamicSegment,
    };
  },

  shouldEntityTouchRouter(name) {
    let isIndex = name === 'index';
    let isBasic = name === 'basic';
    let isApplication = name === 'application';

    return !isBasic && !isIndex && !isApplication;
  },

  shouldTouchRouter(name, options) {
    let entityTouchesRouter = this.shouldEntityTouchRouter(name);
    let isDummy = Boolean(options.dummy);
    let isAddon = Boolean(options.project.isEmberCLIAddon());
    let isAddonDummyOrApp = isDummy === isAddon;

    return entityTouchesRouter && isAddonDummyOrApp && !options.dryRun && !options.inRepoAddon && !options.skipRouter;
  },

  afterInstall(options) {
    updateRouter.call(this, 'add', options);
  },

  afterUninstall(options) {
    updateRouter.call(this, 'remove', options);
  },
  normalizeEntityName(entityName) {
    return entityName.replace(/\.js$/, ''); //Prevent generation of ".js.js" files
  },
};

function updateRouter() {
  // TODO add something
}
