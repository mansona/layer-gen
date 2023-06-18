'use strict';

const { defaults } = require('ember-cli-lodash-subset');
const MockUI = require('console-ui/mock');
const MockAnalytics = require('../helpers/mock-analytics');

module.exports = function CommandOptionsFactory(options) {
  options = options || {};
  return defaults(options, {
    ui: new MockUI(),
    analytics: new MockAnalytics(),
    tasks: {},
    commands: {},
    settings: {},
  });
};
