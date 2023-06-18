'use strict';

const Command = require('../models/command');

module.exports = class RootCommand extends Command {
  isRoot = true;
  name = 'ember';

  anonymousOptions = ['<command (Default: help)>'];
};
