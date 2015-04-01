'use strict';

var MockUI        = require('./mock-ui');
var MockAnalytics = require('./mock-analytics');
var Cli           = require('../../lib/cli');

module.exports = function ember(args) {
  var cli;

  cli = new Cli({
    inputStream:  [],
    outputStream: [],
    cliArgs:      args,
    Leek: MockAnalytics,
    UI: MockUI,
    testing: true
  });

  return cli;
};
