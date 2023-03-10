// const Blueprint = require('../models/blueprint');
// const Task = require('../models/task');
// const parseOptions = require('../utilities/parse-options');
// const logger = require('heimdalljs-logger')('ember-cli:generate-from-blueprint');
// const lintFix = require('../utilities/lint-fix');

import pkgUp from 'pkg-up';
import Blueprint from './blueprint.js';

async function createBlueprints(options) {
  let name = options._[0];
  let noAddonBlueprint = ['mixin', 'blueprint-test'];

  let entity = {
    name: options._[1],
    options,
  };

  let baseBlueprintOptions = {
    target: await pkgUp(),
    entity,
    // ui: this.ui,
    // analytics: this.analytics,
    // project: this.project,
    // settings: this.settings,
    // testing: this.testing,
    taskOptions: options,
    originBlueprintName: name,
  };

  let mainBlueprintOptions = { ...baseBlueprintOptions, ...options };
  let testBlueprintOptions = { ...mainBlueprintOptions, installingTest: true };
  let addonBlueprintOptions = { ...mainBlueprintOptions, installingAddon: true };

  let mainBlueprint = lookupBlueprint(name, {
    blueprintOptions: mainBlueprintOptions,
    ignoreMissing: options.ignoreMissingMain,
  });

  // let testBlueprint = this.lookupBlueprint(`${name}-test`, {
  //   blueprintOptions: testBlueprintOptions,
  //   ignoreMissing: true,
  // });

  // let addonBlueprint = this.lookupBlueprint(`${name}-addon`, {
  //   blueprintOptions: addonBlueprintOptions,
  //   ignoreMissing: true,
  // });

  // otherwise, use default addon-import
  // if (noAddonBlueprint.indexOf(name) < 0 && !addonBlueprint && options.args[1]) {
  //   let mainBlueprintSupportsAddon = mainBlueprint && mainBlueprint.supportsAddon();

  //   if (mainBlueprintSupportsAddon) {
  //     addonBlueprint = this.lookupBlueprint('addon-import', {
  //       blueprintOptions: addonBlueprintOptions,
  //       ignoreMissing: true,
  //     });
  //   }
  // }

  // if (options.ignoreMissingMain && !mainBlueprint) {
  //   return;
  // }

  // if (options.dummy) {
  //   // don't install test or addon reexport for dummy
  //   if (this.project.isEmberCLIAddon()) {
  //     testBlueprint = null;
  //     addonBlueprint = null;
  //   }
  // }

  await mainBlueprint['install'](mainBlueprintOptions);
  if (testBlueprint) {
    if (testBlueprint.locals === Blueprint.prototype.locals) {
      testBlueprint.locals = function (options) {
        return mainBlueprint.locals(options);
      };
    }

    await testBlueprint['install'](testBlueprintOptions);
  }

  if (!addonBlueprint || name.match(/-addon/)) {
    return;
  }
  if (!this.project.isEmberCLIAddon() && mainBlueprintOptions.inRepoAddon === null) {
    return;
  }

  if (addonBlueprint.locals === Blueprint.prototype.locals) {
    addonBlueprint.locals = function (options) {
      return mainBlueprint.locals(options);
    };
  }

  return addonBlueprint['install'](addonBlueprintOptions);
}

function lookupBlueprint(name, { blueprintOptions, ignoreMissing }) {
  return Blueprint.lookup(name, {
    blueprintOptions,
    ignoreMissing,
    // paths: this.project.blueprintLookupPaths(),
  });
}

export default async function run(options) {
  await createBlueprints(options);

  if (options.lintFix) {
    try {
      await lintFix.run(this.project);
    } catch (error) {
      logger.error('Lint fix failed: %o', error);
    }
  }
}
