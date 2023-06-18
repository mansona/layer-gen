'use strict';

const UnknownCommand = require('../commands/unknown');

module.exports = function (commands, commandName, commandArgs, optionHash) {
  let options = optionHash || {};
  let ui = options.ui;

  function aliasMatches(alias) {
    return alias === commandName;
  }

  function findCommand(commands, commandName) {
    for (let key in commands) {
      let command = commands[key];

      let name = command.name;
      let aliases = command.aliases || [];

      if (name === commandName || aliases.some(aliasMatches)) {
        return command;
      }
    }
  }

  // Attempt to find command in ember-cli core commands
  let command = findCommand(commands, commandName);

  let addonWithCommand;
  let addonCommand;

  if (command && addonCommand) {
    if (addonCommand.overrideCore) {
      ui.writeWarnLine(
        `An ember-addon (${addonWithCommand}) has attempted to override the core command "${command.prototype.name}". ` +
          `The addon command will be used as the overridding was explicit.`
      );

      return addonCommand;
    }

    ui.writeWarnLine(
      `An ember-addon (${addonWithCommand}) has attempted to override the core command "${command.prototype.name}". ` +
        `The core command will be used.`
    );
    return command;
  }

  if (command) {
    return command;
  }

  if (addonCommand) {
    return addonCommand;
  }

  // if we didn't find anything, return an "UnknownCommand"
  return class extends UnknownCommand {
    constructor(options) {
      super(options);
      this.name = commandName;
    }
  };
};
