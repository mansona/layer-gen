'use strict';

const { expect } = require('chai');
const Blueprint = require('layer-gen-blueprint');
const Command = require('../../../lib/models/command');
const mergeBlueprintOptions = require('../../../lib/utilities/merge-blueprint-options');
const td = require('testdouble');

describe('merge-blueprint-options', function () {
  let TestCommand = Command.extend({
    name: 'test-command',
    description: 'Runs a test command.',
    aliases: ['t'],
    works: 'everywhere',

    availableOptions: [{ name: 'verbose', type: Boolean, default: false, aliases: ['v'] }],

    beforeRun: mergeBlueprintOptions,
  });

  afterEach(function () {
    td.reset();
  });

  function buildCommand() {
    return new TestCommand({});
  }

  it("it works as a command's beforeRun()", function () {
    let command, availableOptions;

    td.replace(Blueprint, 'lookup', td.function());
    td.when(Blueprint.lookup('test-blueprint'), { ignoreExtraArgs: true }).thenReturn({
      availableOptions: [{ name: 'custom-blueprint-option', type: String }],
    });

    command = buildCommand();
    command.beforeRun(['test-blueprint']);

    availableOptions = command.availableOptions.map(({ name }) => name);
    expect(availableOptions).to.contain('verbose');
    expect(availableOptions).to.contain('custom-blueprint-option');
  });
});
