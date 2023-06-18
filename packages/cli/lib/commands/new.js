'use strict';

const chalk = require('chalk');
const Command = require('../models/command');
const SilentError = require('silent-error');
const isValidProjectName = require('../utilities/valid-project-name');
const normalizeBlueprint = require('../utilities/normalize-blueprint-option');
const Blueprint = require('layer-gen-blueprint');

module.exports = class NewCommand extends Command {
  static name = 'new';
  description = `Creates a new directory and runs ${chalk.green('ember init')} in it.`;
  works = 'outsideProject';

  availableOptions = [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint', type: String, default: 'app', aliases: ['b'] },
    { name: 'skip-npm', type: Boolean, default: false, aliases: ['sn'] },
    { name: 'skip-git', type: Boolean, default: false, aliases: ['sg'] },
    {
      name: 'welcome',
      type: Boolean,
      default: true,
      description: 'Installs and uses {{ember-welcome-page}}. Use --no-welcome to skip it.',
    },
    { name: 'yarn', type: Boolean }, // no default means use yarn if the blueprint has a yarn.lock
    { name: 'directory', type: String, aliases: ['dir'] },
    {
      name: 'lang',
      type: String,
      description: 'Sets the base human language of the application via index.html',
    },
    { name: 'embroider', type: Boolean, default: false, description: 'Enables the build system to use Embroider' },
    {
      name: 'ci-provider',
      type: ['travis', 'github'],
      description: 'Installs the default CI blueprint. Either Travis or Github Actions is supported.',
    },
    {
      name: 'interactive',
      type: Boolean,
      default: false,
      aliases: ['i'],
      description: 'Create a new Ember app/addon in an interactive way.',
    },
    { name: 'typescript', type: Boolean, default: false, description: 'Set up the app to use TypeScript' },
  ];

  anonymousOptions = ['<app-name>'];

  beforeRun(rawArgs) {
    if (rawArgs.length === 0) {
      return;
    }
    // merge in blueprint availableOptions
    let blueprint;
    try {
      blueprint = Blueprint.lookup(rawArgs[0], {});
      this.registerOptions(blueprint);
    } catch (e) {
      SilentError.debugOrThrow(`ember-cli/commands/${this.name}`, e);
    }
  }

  async run(commandOptions, rawArgs) {
    let projectName = rawArgs[0],
      message;

    commandOptions.name = rawArgs.shift();

    if (!projectName || commandOptions.interactive) {
      let answers = await this.runTask('InteractiveNew', commandOptions);

      commandOptions.blueprint = answers.blueprint;

      if (answers.name) {
        projectName = answers.name;
        commandOptions.name = answers.name;
      }

      if (answers.lang) {
        commandOptions.lang = answers.lang;
      }

      if (answers.packageManager) {
        commandOptions.yarn = answers.packageManager === 'yarn';
      }

      if (answers.ciProvider) {
        commandOptions.ciProvider = answers.ciProvider;
      }
    }

    if (!commandOptions.ciProvider) {
      commandOptions.ciProvider = 'github';
    }

    if (commandOptions.dryRun) {
      commandOptions.skipGit = true;
    }

    if (projectName === '.') {
      let blueprintName = commandOptions.blueprint === 'app' ? 'application' : commandOptions.blueprint;
      message = `Trying to generate an ${blueprintName} structure in this directory? Use \`ember init\` instead.`;

      return Promise.reject(new SilentError(message));
    }

    if (!isValidProjectName(projectName)) {
      message = `We currently do not support a name of \`${projectName}\`.`;

      return Promise.reject(new SilentError(message));
    }

    commandOptions.blueprint = normalizeBlueprint(commandOptions.blueprint);

    let InitCommand = this.commands.Init;

    let initCommand = new InitCommand({
      ui: this.ui,
      analytics: this.analytics,
      tasks: this.tasks,
    });

    await this.runTask('CreateAndStepIntoDirectory', {
      projectName,
      directoryName: commandOptions.directory,
      dryRun: commandOptions.dryRun,
    });

    // initCommand.project.root = process.cwd();

    return await initCommand.run(commandOptions, rawArgs);
  }
};
