'use strict';

const { expect } = require('chai');
const MockUI = require('console-ui/mock');
const MockAnalytics = require('../../helpers/mock-analytics');
const td = require('testdouble');
const CLI = require('../../../lib/cli/cli');

let ui;
let analytics;
let commands = {};
let isWithinProject;
let project;
let willInterruptProcess;

// helper to similate running the CLI
function ember(args) {
  let cli = new CLI({
    ui,
    analytics,
    testing: true,
  });

  return cli
    .run({
      tasks: {},
      commands,
      cliArgs: args || [],
      settings: {},
      project,
    })
    .then(function (value) {
      return value;
    });
}

function stubCallHelp() {
  return td.replace(CLI.prototype, 'callHelp', td.function());
}

function stubValidateAndRunHelp(name) {
  let stub = stubValidateAndRun(name);
  td.when(stub(), { ignoreExtraArgs: true, times: 1 }).thenReturn('callHelp');
  return stub;
}

function stubValidateAndRun(name) {
  commands[name] = require(`../../../lib/commands/${name}`);

  return td.replace(commands[name].prototype, 'validateAndRun', td.function());
}

function stubRun(name) {
  commands[name] = require(`../../../lib/commands/${name}`);
  return td.replace(commands[name].prototype, 'run', td.function());
}

describe('Unit: CLI', function () {
  beforeEach(function () {
    willInterruptProcess = require('../../../lib/utilities/will-interrupt-process');
    td.replace(willInterruptProcess, 'addHandler', td.function());
    td.replace(willInterruptProcess, 'removeHandler', td.function());

    ui = new MockUI();
    analytics = new MockAnalytics();
    commands = {};
    isWithinProject = true;
    project = {
      isEmberCLIProject() {
        // similate being inside or outside of a project
        return isWithinProject;
      },
      hasDependencies() {
        return true;
      },
      blueprintLookupPaths() {
        return [];
      },
    };
  });

  afterEach(function () {
    td.reset();

    delete process.env.EMBER_ENV;
    commands = ui = undefined;
  });

  this.timeout(10000);

  it('ember', function () {
    let help = stubValidateAndRun('help');

    return ember().then(function () {
      td.verify(help(), { ignoreExtraArgs: true, times: 1 });
      let output = ui.output.trim();
      expect(output).to.equal('', 'expected no extra output');
    });
  });

  /*
  it('logError', function() {
    var cli = new CLI({
      ui: ui,
      analytics: analytics,
      testing: true
    });
    var error = new Error('Error message!');
    var expected = {exitCode: 1, ui: ui, error: error};
    expect(cli.logError(error)).to.eql(expected, 'expected error object');
  });
  */

  it('callHelp', function () {
    let cli = new CLI({
      ui,
      analytics,
      testing: true,
    });
    let init = stubValidateAndRun('init');
    let help = stubValidateAndRun('help');
    let helpOptions = {
      environment: {
        tasks: {},
        commands,
        cliArgs: [],
        settings: {},
        project: {
          isEmberCLIProject() {
            // similate being inside or outside of a project
            return isWithinProject;
          },
          hasDependencies() {
            return true;
          },
          blueprintLookupPaths() {
            return [];
          },
        },
      },
      commandName: 'init',
      commandArgs: [],
    };
    cli.callHelp(helpOptions);
    td.verify(help(), { ignoreExtraArgs: true, times: 1 });
    td.verify(init(), { ignoreExtraArgs: true, times: 0 });
  });

  it.skip('errors correctly if the init hook errors', function () {
    stubValidateAndRun('help');

    let cli = new CLI({
      ui,
      analytics,
      testing: true,
    });

    let logError = td.replace(cli, 'logError');
    let err = new Error('init failed');

    return cli
      .run({
        tasks: {},
        commands,
        cliArgs: [],
        settings: {},
        project,
      })
      .then(function () {
        td.verify(logError(err));
      });
  });

  it('"run" method must throw error if no evironment provided', function () {
    stubValidateAndRun('help');

    let cli = new CLI({
      ui,
      analytics,
      testing: true,
    });

    let wasResolved = false;
    cli
      .run()
      .then(() => {
        wasResolved = true;
      })
      .catch((err) => {
        expect(err.toString()).to.be.equal('Error: Unable to execute "run" command without environment argument');
      })
      .finally(() => {
        expect(wasResolved).to.be.false;
      });
  });

  it('errors correctly if "run" method not called before "maybeMakeCommand" execution', function () {
    stubValidateAndRun('help');

    let cli = new CLI({
      ui,
      analytics,
      testing: true,
    });

    try {
      cli.maybeMakeCommand('foo', ['bar']);
    } catch (err) {
      expect(err.toString()).to.be.equal(
        'Error: Unable to make command without environment, you have to execute "run" method first.'
      );
    }
  });

  describe('help', function () {
    ['--help', '-h'].forEach(function (command) {
      it(`ember ${command}`, function () {
        let help = stubValidateAndRun('help');

        return ember([command]).then(function () {
          td.verify(help(), { ignoreExtraArgs: true, times: 1 });
          let output = ui.output.trim();
          expect(output).to.equal('', 'expected no extra output');
        });
      });

      it(`ember new ${command}`, function () {
        let help = stubCallHelp();
        stubValidateAndRunHelp('new');

        return ember(['new', command]).then(function () {
          td.verify(help(), { ignoreExtraArgs: true, times: 1 });
          let output = ui.output.trim();
          expect(output).to.equal('', 'expected no extra output');
        });
      });
    });
  });

  ['--version', '-v'].forEach(function (command) {
    it.skip(`ember ${command}`, function () {
      let version = stubValidateAndRun('version');

      return ember([command]).then(function () {
        let output = ui.output.trim();
        expect(output).to.equal('', 'expected no extra output');
        td.verify(version(), { ignoreExtraArgs: true, times: 1 });
      });
    });
  });

  describe('generate', function () {
    ['generate', 'g'].forEach(function (command) {
      it(`ember ${command} foo bar baz`, function () {
        let generate = stubRun('generate');

        return ember([command, 'foo', 'bar', 'baz']).then(function () {
          let captor = td.matchers.captor();
          td.verify(generate(captor.capture(), ['foo', 'bar', 'baz']), { times: 1 });

          let output = ui.output.trim();

          expect(output).to.equal('', 'expected no extra output');
        });
      });
    });
  });

  describe('init', function () {
    ['init'].forEach(function (command) {
      it(`ember ${command}`, function () {
        let init = stubValidateAndRun('init');

        return ember([command]).then(function () {
          td.verify(init(), { ignoreExtraArgs: true, times: 1 });
        });
      });

      it(`ember ${command} <app-name>`, function () {
        let init = stubRun('init');

        return ember([command, 'my-blog']).then(function () {
          let captor = td.matchers.captor();
          td.verify(init(captor.capture(), ['my-blog']), { times: 1 });

          let output = ui.output.trim();

          expect(output).to.equal('', 'expected no extra output');
        });
      });
    });
  });

  describe('new', function () {
    it('ember new', function () {
      isWithinProject = false;

      let newCommand = stubRun('new');

      return ember(['new']).then(function () {
        td.verify(newCommand(), { ignoreExtraArgs: true, times: 1 });
      });
    });

    it('ember new MyApp', function () {
      isWithinProject = false;

      let newCommand = stubRun('new');

      return ember(['new', 'MyApp']).then(function () {
        td.verify(newCommand(td.matchers.anything(), ['MyApp']), { times: 1 });
      });
    });
  });

  it.skip('ember <valid command>', function () {
    let help = stubValidateAndRun('help');
    let serve = stubValidateAndRun('serve');

    return ember(['serve']).then(function () {
      td.verify(help(), { ignoreExtraArgs: true, times: 0 });
      td.verify(serve(), { ignoreExtraArgs: true, times: 1 });

      let output = ui.output.trim();
      expect(output).to.equal('', 'expected no extra output');
    });
  });

  it.skip('ember <valid command with args>', function () {
    let help = stubValidateAndRun('help');
    let serve = stubValidateAndRun('serve');

    return ember(['serve', 'lorem', 'ipsum', 'dolor', '--flag1=one']).then(function () {
      let args = serve.calledWith[0][0].cliArgs;

      expect(help.called).to.equal(0, 'expected the help command NOT to be run');
      expect(serve.called).to.equal(1, 'expected the foo command to be run');
      expect(args).to.deep.equal(['serve', 'lorem', 'ipsum', 'dolor'], 'expects correct arguments');

      expect(serve.calledWith[0].length).to.equal(2, 'expect foo to receive a total of 4 args');

      let output = ui.output.trim();
      expect(output).to.equal('', 'expected no extra output');
    });
  });

  it('ember <invalid command>', function () {
    let help = stubValidateAndRun('help');

    return expect(ember(['unknownCommand'])).to.be.rejected.then((error) => {
      expect(help.called, 'help command was executed').to.not.be.ok;
      expect(error.name).to.equal('SilentError');
      expect(error.message).to.equal(
        'The specified command unknownCommand is invalid. For available options, see `ember help`.'
      );
    });
  });

  describe.skip('default options config file', function () {
    it('reads default options from .ember-cli file', function () {
      let defaults = ['--output', process.cwd()];
      let build = stubValidateAndRun('build');

      return ember(['build'], defaults).then(function () {
        let options = build.calledWith[0][1].cliOptions;

        expect(options.output).to.equal(process.cwd());
      });
    });
  });

  describe('logError', function () {
    it('returns error status code in production', function () {
      let cli = new CLI({
        ui: new MockUI(),
        testing: false,
      });

      expect(cli.logError('foo')).to.equal(1);
    });

    it('does not throw an error in production', function () {
      let cli = new CLI({
        ui: new MockUI(),
        testing: false,
      });

      let invokeError = cli.logError.bind(cli, new Error('foo'));

      expect(invokeError).to.not.throw();
    });

    it('throws error in testing', function () {
      let cli = new CLI({
        ui: new MockUI(),
        testing: true,
      });

      let invokeError = cli.logError.bind(cli, new Error('foo'));

      expect(invokeError).to.throw(Error, 'foo');
    });
  });

  describe('Global command options', function () {
    let verboseCommand = function (args) {
      return ember(['fake-command', '--verbose'].concat(args));
    };

    describe('--verbose', function () {
      describe('option parsing', function () {
        afterEach(function () {
          delete process.env.EMBER_VERBOSE_FAKE_OPTION_1;
          delete process.env.EMBER_VERBOSE_FAKE_OPTION_2;
        });

        // eslint-disable-next-line no-template-curly-in-string
        it('sets process.env.EMBER_VERBOSE_${NAME} for each space delimited option', function () {
          return expect(verboseCommand(['fake_option_1', 'fake_option_2'])).to.be.rejected.then((error) => {
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_1).to.be.ok;
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_2).to.be.ok;
            expect(error.name).to.equal('SilentError');
            expect(error.message).to.equal(
              'The specified command fake-command is invalid. For available options, see `ember help`.'
            );
          });
        });

        it('ignores verbose options after --', function () {
          return expect(verboseCommand(['fake_option_1', '--fake-option', 'fake_option_2'])).to.be.rejected.then(
            (error) => {
              expect(process.env.EMBER_VERBOSE_FAKE_OPTION_1).to.be.ok;
              expect(process.env.EMBER_VERBOSE_FAKE_OPTION_2).to.not.be.ok;
              expect(error.name).to.equal('SilentError');
              expect(error.message).to.equal(
                'The specified command fake-command is invalid. For available options, see `ember help`.'
              );
            }
          );
        });

        it('ignores verbose options after -', function () {
          return expect(verboseCommand(['fake_option_1', '-f', 'fake_option_2'])).to.be.rejected.then((error) => {
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_1).to.be.ok;
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_2).to.not.be.ok;
            expect(error.name).to.equal('SilentError');
            expect(error.message).to.equal(
              'The specified command fake-command is invalid. For available options, see `ember help`.'
            );
          });
        });
      });
    });
  });
});
