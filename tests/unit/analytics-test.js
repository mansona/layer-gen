'use strict';

const { expect } = require('chai');
const Command = require('../../lib/models/command');
const MockUI = require('console-ui/mock');
let command;
let called = false;

describe.skip('analytics', function () {
  beforeEach(function () {
    let analytics = {
      track() {
        called = true;
      },
    };

    let FakeCommand = Command.extend({
      name: 'fake-command',
      run() {},
    });

    command = new FakeCommand({
      ui: new MockUI(),
      analytics,
    });
  });

  afterEach(function () {
    command = null;
  });

  it('track gets invoked on command.validateAndRun()', async function () {
    await command.validateAndRun([]);
    expect(called, 'expected analytics.track to be called').to.be.true;
  });
});
