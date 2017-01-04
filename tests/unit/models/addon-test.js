'use strict';

var fs = require('fs-extra');
var path = require('path');
var Project = require('../../../lib/models/project');
var Addon = require('../../../lib/models/addon');
var Promise = require('../../../lib/ext/promise');
var expect = require('chai').expect;
var remove = Promise.denodeify(fs.remove);
var findWhere = require('ember-cli-lodash-subset').find;
var MockUI = require('console-ui/mock');
var MockCLI = require('../../helpers/mock-cli');
var mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
var experiments = require('../../experiments');

var broccoli = require('broccoli-builder');
var walkSync = require('walk-sync');
var td = require('testdouble');

var root = process.cwd();
var tmproot = path.join(root, 'tmp');

var fixturePath = path.resolve(__dirname, '../../fixtures/addon');
var ensurePosixPath = require('ensure-posix-path');

describe('models/addon.js', function() {
  var addon, project, projectPath;

  describe('root property', function() {
    it('is required', function() {
      expect(function() {
        var TheAddon = Addon.extend({ root: undefined });
        new TheAddon();
      }).to.throw(/root/);
    });
  });

  describe('old core object compat', function() {
    it('treeGenerator works without .project', function() {
      var warning;
      var TheAddon = Addon.extend({
        name: 'such name',
        root: path.resolve(fixturePath, 'simple'),
        _warn: function(message) {
          warning = '' + message;
        },
      });
      var addon = new TheAddon();
      expect(function() {
        addon.treeGenerator('foo');
      }).to.not.throw();
      expect(warning).to.match(/Addon: `such name` is missing addon.project/);
    });
  });

  describe('treePaths and treeForMethods', function() {
    var FirstAddon, SecondAddon;

    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      var packageContents = require(path.join(projectPath, 'package.json'));
      var cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);

      FirstAddon = Addon.extend({
        name: 'first',
        root: projectPath,

        init: function() {
          this._super.apply(this, arguments);
          this.treePaths.vendor = 'blazorz';
          this.treeForMethods.public = 'huzzah!';
        },
      });

      SecondAddon = Addon.extend({
        name: 'first',
        root: projectPath,

        init: function() {
          this._super.apply(this, arguments);
          this.treePaths.vendor = 'blammo';
          this.treeForMethods.public = 'boooo';
        },
      });

    });

    describe('.jshintAddonTree', function() {
      var addon;

      beforeEach(function() {
        addon = new FirstAddon(project, project);

        // TODO: fix config story...
        addon.app = {
          options: { jshintrc: {} },
          addonLintTree: function(type, tree) { return tree; },
        };

        addon.jshintTrees = function() {};

      });

      it('uses the fullPath', function() {
        var addonPath;
        addon.addonJsFiles = function(_path) {
          addonPath = _path;
          return _path;
        };

        var root = path.join(fixturePath, 'with-styles');
        addon.root = root;

        addon.jshintAddonTree();
        expect(addonPath).to.eql(ensurePosixPath(path.join(root, 'addon')));
      });

      it('lints the files before preprocessing', function() {
        addon.preprocessJs = function() {
          expect(false, 'should not preprocess files').to.eql(true);
        };

        var root = path.join(fixturePath, 'with-styles');
        addon.root = root;

        addon.jshintAddonTree();
      });

    });

    it('modifying a treePath does not affect other addons', function() {
      var first = new FirstAddon(project);
      var second = new SecondAddon(project);

      expect(first.treePaths.vendor).to.equal('blazorz');
      expect(second.treePaths.vendor).to.equal('blammo');
    });

    it('modifying a treeForMethod does not affect other addons', function() {
      var first = new FirstAddon(project);
      var second = new SecondAddon(project);

      expect(first.treeForMethods.public).to.equal('huzzah!');
      expect(second.treeForMethods.public).to.equal('boooo');
    });
  });

  describe('resolvePath', function() {
    beforeEach(function() {
      addon = {
        pkg: {
          'ember-addon': {
            'main': '',
          },
        },
        path: '',
      };
    });

    it('adds .js if not present', function() {
      addon.pkg['ember-addon']['main'] = 'index';
      var resolvedFile = path.basename(Addon.resolvePath(addon));
      expect(resolvedFile).to.equal('index.js');
    });

    it('doesn\'t add .js if it is .js', function() {
      addon.pkg['ember-addon']['main'] = 'index.js';
      var resolvedFile = path.basename(Addon.resolvePath(addon));
      expect(resolvedFile).to.equal('index.js');
    });

    it('doesn\'t add .js if it has another extension', function() {
      addon.pkg['ember-addon']['main'] = 'index.coffee';
      var resolvedFile = path.basename(Addon.resolvePath(addon));
      expect(resolvedFile).to.equal('index.coffee');
    });

    it('allows lookup of non-`index.js` `main` entry points', function() {
      delete addon.pkg['ember-addon'];
      addon.pkg['main'] = 'some/other/path.js';

      var resolvedFile = Addon.resolvePath(addon);
      expect(resolvedFile).to.equal(path.join(process.cwd(), 'some/other/path.js'));
    });

    it('falls back to `index.js` if `main` and `ember-addon` are not found', function() {
      delete addon.pkg['ember-addon'];

      var resolvedFile = Addon.resolvePath(addon);
      expect(resolvedFile).to.equal(path.join(process.cwd(), 'index.js'));
    });

    it('falls back to `index.js` if `main` and `ember-addon.main` are not found', function() {
      delete addon.pkg['ember-addon'].main;

      var resolvedFile = Addon.resolvePath(addon);
      expect(resolvedFile).to.equal(path.join(process.cwd(), 'index.js'));
    });
  });

  describe('initialized addon', function() {
    this.timeout(40000);
    before(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      var packageContents = require(path.join(projectPath, 'package.json'));
      var ui = new MockUI();
      var cli = new MockCLI({ ui: ui });
      project = new Project(projectPath, packageContents, ui, cli);
      var discoverFromCli = td.replace(project.addonDiscovery, 'discoverFromCli');
      td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);
      project.initializeAddons();
    });

    describe('generated addon', function() {
      beforeEach(function() {
        addon = findWhere(project.addons, { name: 'Ember CLI Generated with export' });

        // Clear the caches
        delete addon._moduleName;
      });

      it('sets its project', function() {
        expect(addon.project.name).to.equal(project.name);
      });

      it('sets its parent', function() {
        expect(addon.parent.name).to.equal(project.name);
      });

      it('sets the root', function() {
        expect(addon.root).to.not.equal(undefined);
      });

      it('sets the pkg', function() {
        expect(addon.pkg).to.not.equal(undefined);
      });

      describe('trees for its treePaths', function() {
        it('app', function() {
          var tree = addon.treeFor('app');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('styles', function() {
          var tree = addon.treeFor('styles');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('templates', function() {
          var tree = addon.treeFor('templates');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('addon-templates', function() {
          var tree = addon.treeFor('addon-templates');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('vendor', function() {
          var tree = addon.treeFor('vendor');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('addon', function() {
          var app = {
            importWhitelist: {},
            options: {},
          };
          addon.registry = {
            app: addon,
            load: function() {
              return [{
                toTree: function(tree) {
                  return tree;
                },
              }];
            },

            extensionsForType: function() {
              return ['js'];
            },
          };
          addon.app = app;
          var tree = addon.treeFor('addon');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });
      });

      describe('custom treeFor methods', function() {
        it('can define treeForApp', function() {
          addon.treeForApp = td.function();
          addon.treeFor('app');
          td.verify(addon.treeForApp(), { ignoreExtraArgs: true });
        });

        it('can define treeForStyles', function() {
          addon.treeForStyles = td.function();
          addon.treeFor('styles');
          td.verify(addon.treeForStyles(), { ignoreExtraArgs: true });
        });

        it('can define treeForVendor', function() {
          addon.treeForVendor = td.function();
          addon.treeFor('vendor');
          td.verify(addon.treeForVendor(), { ignoreExtraArgs: true });
        });

        it('can define treeForTemplates', function() {
          addon.treeForTemplates = td.function();
          addon.treeFor('templates');
          td.verify(addon.treeForTemplates(), { ignoreExtraArgs: true });
        });

        it('can define treeForAddonTemplates', function() {
          addon.treeForAddonTemplates = td.function();
          addon.treeFor('addon-templates');
          td.verify(addon.treeForAddonTemplates(), { ignoreExtraArgs: true });
        });

        it('can define treeForPublic', function() {
          addon.treeForPublic = td.function();
          addon.treeFor('public');
          td.verify(addon.treeForPublic(), { ignoreExtraArgs: true });
        });
      });
    });

    describe('addon with dependencies', function() {
      beforeEach(function() {
        addon = findWhere(project.addons, { name: 'Ember Addon With Dependencies' });
      });

      it('returns a listing of all dependencies in the addon\'s package.json', function() {
        var expected = {
          'ember-cli': 'latest',
          'something-else': 'latest',
        };

        expect(addon.dependencies()).to.deep.equal(expected);
      });
    });

    it('must define a `name` property', function() {
      var Foo = Addon.extend({ root: 'foo' });

      expect(function() {
        new Foo(project);
      }).to.throw(/An addon must define a `name` property./);
    });

    describe('isDevelopingAddon', function() {
      var originalEnvValue, addon, project;

      beforeEach(function() {
        var MyAddon = Addon.extend({
          name: 'test-project',
          root: 'foo',
        });

        var projectPath = path.resolve(fixturePath, 'simple');
        var packageContents = require(path.join(projectPath, 'package.json'));
        var cli = new MockCLI();

        project = new Project(projectPath, packageContents, cli.ui, cli);

        addon = new MyAddon(project);

        originalEnvValue = process.env.EMBER_ADDON_ENV;
      });

      afterEach(function() {
        if (originalEnvValue === undefined) {
          delete process.env.EMBER_ADDON_ENV;
        } else {
          process.env.EMBER_ADDON_ENV = originalEnvValue;
        }
      });

      it('returns true when `EMBER_ADDON_ENV` is set to development', function() {
        process.env.EMBER_ADDON_ENV = 'development';

        expect(addon.isDevelopingAddon(), 'addon is being developed').to.eql(true);
      });

      it('returns false when `EMBER_ADDON_ENV` is not set', function() {
        delete process.env.EMBER_ADDON_ENV;

        expect(addon.isDevelopingAddon()).to.eql(false);
      });

      it('returns false when `EMBER_ADDON_ENV` is something other than `development`', function() {
        process.env.EMBER_ADDON_ENV = 'production';

        expect(addon.isDevelopingAddon()).to.equal(false);
      });

      it('returns false when the addon is not the one being developed', function() {
        process.env.EMBER_ADDON_ENV = 'development';

        addon.name = 'my-addon';
        expect(addon.isDevelopingAddon(), 'addon is not being developed').to.eql(false);
      });
    });

    describe('hintingEnabled', function() {
      /**
        Tests the various configuration options that affect the hintingEnabled method.

       | configuration | test1 | test2 | test3 | test4 | test5 |
       | ------------- | ----- | ----- | ----- | ----- | ----- |
       | hinting       | true  | true  | true  | false | unset |
       | environment   | dev   | N/A   | prod  | N\A   | N\A   |
       | test_command  | set   | set   | unset | set   | set   |
       | RESULT        | true  | true  | false | false | true  |

        @method hintingEnabled
       */

      var originalEnvValue, originalEmberEnvValue, originalTestCommand, addon, project;

      beforeEach(function() {
        var MyAddon = Addon.extend({
          name: 'test-project',
          root: 'foo',
        });

        var projectPath = path.resolve(fixturePath, 'simple');
        var packageContents = require(path.join(projectPath, 'package.json'));
        var cli = new MockCLI();

        project = new Project(projectPath, packageContents, cli.ui, cli);

        addon = new MyAddon(project);

        originalEmberEnvValue = process.env.EMBER_ENV;
        originalEnvValue = process.env.EMBER_ADDON_ENV;
        originalTestCommand = process.env.EMBER_CLI_TEST_COMMAND;
      });

      afterEach(function() {
        addon.app = {
          options: {},
        };

        if (originalEnvValue === undefined) {
          delete process.env.EMBER_ADDON_ENV;
        } else {
          process.env.EMBER_ADDON_ENV = originalEnvValue;
        }

        if (originalTestCommand === undefined) {
          delete process.env.EMBER_CLI_TEST_COMMAND;
        } else {
          process.env.EMBER_CLI_TEST_COMMAND = originalTestCommand;
        }

        if (originalEmberEnvValue === undefined) {
          delete process.env.EMBER_ENV;
        } else {
          process.env.EMBER_ENV = originalEmberEnvValue;
        }
      });

      it('returns true when `EMBER_ENV` is not set to production and options.hinting is true', function() {
        process.env.EMBER_ENV = 'development';

        addon.app = {
          options: { hinting: true },
        };

        expect(addon.hintingEnabled()).to.be.true;
      });

      it('returns true when `EMBER_CLI_TEST_COMMAND` is set and options.hinting is true', function() {
        addon.app = {
          options: { hinting: true },
        };

        expect(addon.hintingEnabled()).to.be.true;
      });

      it('returns false when `EMBER_ENV` is set to production, `EMBER_CLI_TEST_COMMAND` is unset and options.hinting is true', function() {
        process.env.EMBER_ENV = 'production';
        delete process.env.EMBER_CLI_TEST_COMMAND;

        addon.app = {
          options: { hinting: true },
        };

        expect(addon.hintingEnabled()).to.be.false;
      });

      it('returns false when options.hinting is set to false', function() {
        addon.app = {
          options: { hinting: false },
        };

        expect(addon.hintingEnabled()).to.be.false;
      });

      it('returns true when options.hinting is not set', function() {
        expect(addon.hintingEnabled()).to.be.ok;
      });
    });

    describe('treeGenerator', function() {
      it('watch tree when developing the addon itself', function() {
        addon.isDevelopingAddon = function() { return true; };

        var tree = addon.treeGenerator('foo/bar');

        expect(tree.__broccoliGetInfo__()).to.have.property('watched', true);
      });

      it('uses UnwatchedDir when not developing the addon itself', function() {
        addon.isDevelopingAddon = function() { return false; };

        var tree = addon.treeGenerator('foo/bar');

        expect(tree.__broccoliGetInfo__()).to.have.property('watched', false);
      });
    });

    describe('blueprintsPath', function() {
      var tmpdir;

      beforeEach(function() {
        return mkTmpDirIn(tmproot).then(function(dir) {
          tmpdir = dir;
          addon.root = tmpdir;
        });
      });

      afterEach(function() {
        return remove(tmproot);
      });

      it('returns undefined if the `blueprint` folder does not exist', function() {
        var returnedPath = addon.blueprintsPath();

        expect(returnedPath).to.equal(undefined);
      });

      it('returns blueprint path if the folder exists', function() {
        var blueprintsDir = path.join(tmpdir, 'blueprints');
        fs.mkdirSync(blueprintsDir);

        var returnedPath = addon.blueprintsPath();

        expect(returnedPath).to.equal(blueprintsDir);
      });
    });

    describe('config', function() {
      it('returns undefined if `config/environment.js` does not exist', function() {
        addon.root = path.join(fixturePath, 'no-config');
        var result = addon.config();

        expect(result).to.equal(undefined);
      });

      it('returns blueprint path if the folder exists', function() {
        addon.root = path.join(fixturePath, 'with-config');
        var appConfig = {};

        addon.config('development', appConfig);

        expect(appConfig.addon).to.equal('with-config');
      });
    });
  });

  describe('Addon.lookup', function() {
    it('should throw an error if an addon could not be found', function() {
      var addon = {
        path: 'foo/bar-baz/blah/doesnt-exist',
        pkg: {
          name: 'dummy-addon',
          'ember-addon': { },
        },
      };

      expect(function() {
        Addon.lookup(addon);
      }).to.throw(/The `dummy-addon` addon could not be found at `foo\/bar-baz\/blah\/doesnt-exist`\./);
    });
  });

  describe('compileTemplates', function() {
    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      var packageContents = require(path.join(projectPath, 'package.json'));
      var cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);
      var discoverFromCli = td.replace(project.addonDiscovery, 'discoverFromCli');
      td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);

      project.initializeAddons();

      addon = findWhere(project.addons, { name: 'Ember CLI Generated with export' });
    });

    it('should throw a useful error if a template compiler is not present -- non-pods', function() {
      addon.root = path.join(fixturePath, 'with-addon-templates');

      expect(function() {
        addon.compileTemplates();
      }).to.throw(
        'Addon templates were detected, but there ' +
        'are no template compilers registered for `' + addon.name + '`. ' +
        'Please make sure your template precompiler (commonly `ember-cli-htmlbars`) ' +
        'is listed in `dependencies` (NOT `devDependencies`) in ' +
        '`' + addon.name + '`\'s `package.json`.'
      );
    });

    it('should throw a useful error if a template compiler is not present -- pods', function() {
      addon.root = path.join(fixturePath, 'with-addon-pod-templates');

      expect(function() {
        addon.compileTemplates();
      }).to.throw(
        'Addon templates were detected, but there ' +
        'are no template compilers registered for `' + addon.name + '`. ' +
        'Please make sure your template precompiler (commonly `ember-cli-htmlbars`) ' +
        'is listed in `dependencies` (NOT `devDependencies`) in ' +
        '`' + addon.name + '`\'s `package.json`.'
      );
    });

    it('should not throw an error if addon/templates is present but empty', function() {
      addon.root = path.join(fixturePath, 'with-empty-addon-templates');

      expect(function() {
        addon.compileTemplates();
      }).not.to.throw();
    });
  });

  describe('_fileSystemInfo', function() {
    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      var packageContents = require(path.join(projectPath, 'package.json'));
      var cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);
      var discoverFromCli = td.replace(project.addonDiscovery, 'discoverFromCli');
      td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);

      project.initializeAddons();

      addon = findWhere(project.addons, { name: 'Ember CLI Generated with export' });
    });

    it('should not call _getAddonTemplatesTreeFiles when default treePath is used', function() {
      var wasCalled = false;
      addon._getAddonTemplatesTreeFiles = function() {
        wasCalled = true;
        return [];
      };

      addon._fileSystemInfo();

      expect(wasCalled).to.not.be.ok;
    });

    it('should call _getAddonTemplatesTreeFiles when custom treePaths[\'addon-templates\'] is used', function() {
      addon.treePaths['addon-templates'] = 'foo';
      var wasCalled = false;
      addon._getAddonTemplatesTreeFiles = function() {
        wasCalled = true;
        return [];
      };

      addon._fileSystemInfo();

      expect(wasCalled).to.be.ok;
    });

    it('hasPodTemplates when pod templates found', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'foo-bar/',
          'foo-bar/component.js',
          'foo-bar/template.hbs',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: true,
        hasTemplates: true,
        hasPodTemplates: true,
      });
    });

    it('does not hasPodTemplates when no pod templates found', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'templates/',
          'templates/components/',
          'templates/components/foo-bar.hbs',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: false,
        hasTemplates: true,
        hasPodTemplates: false,
      });
    });

    it('does not hasPodTemplates when no pod templates found (pod-like structure in `addon/templates/`)', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'templates/',
          // this doesn't need "pod template handling" because
          // it is actually in the addon-templates tree
          'templates/foo-bar/template.hbs',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: false,
        hasTemplates: true,
        hasPodTemplates: false,
      });
    });

    it('does not hasTemplates when no templates found', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'components/',
          'components/foo-bar.js',
          'templates/',
          'templates/components/',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: true,
        hasTemplates: false,
        hasPodTemplates: false,
      });
    });

    it('does not hasJSFiles when none found', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'components/',
          'templates/',
          'templates/components/',
          'styles/foo.css',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: false,
        hasTemplates: false,
        hasPodTemplates: false,
      });
    });
  });

  describe('addonDiscovery', function() {
    var discovery, addon, ui;

    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      ui = new MockUI();
      var cli = new MockCLI({ ui: ui });
      project = new Project(projectPath, packageContents, ui, cli);

      var AddonTemp = Addon.extend({
        name: 'temp',
        root: 'foo',
      });

      addon = new AddonTemp(project, project);
      discovery = addon.addonDiscovery;
    });

    it('is provided with the addon\'s `ui` object', function() {
      expect(discovery.ui).to.equal(ui);
    });
  });

  describe('treeForStyles', function() {
    var builder, addon;

    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'with-app-styles');
      var packageContents = require(path.join(projectPath, 'package.json'));
      var cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);

      var BaseAddon = Addon.extend({
        name: 'base-addon',
        root: projectPath,
      });

      addon = new BaseAddon(project, project);
    });

    afterEach(function() {
      if (builder) {
        return builder.cleanup();
      }
    });

    it('should move files in the root of the addons app/styles tree into the app/styles path', function() {
      builder = new broccoli.Builder(addon.treeFor('styles'));

      return builder.build()
        .then(function(results) {
          var outputPath = results.directory;

          var expected = [
            'app/',
            'app/styles/',
            'app/styles/foo-bar.css',
          ];

          expect(walkSync(outputPath)).to.eql(expected);
        });
    });
  });

  describe('._eachProjectAddonInvoke', function() {
    beforeEach(function() {
      var MyAddon = Addon.extend({
        name: 'test-project',
        root: 'foo',
      });

      var projectPath = path.resolve(fixturePath, 'simple');
      var packageContents = require(path.join(projectPath, 'package.json'));
      var cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);
      addon = new MyAddon(project, project);
    });

    it('should invoke the method on each of the project addons', function() {
      var counter = 0;
      project.addons = [
        { foo: function(num) { counter += num; } },
        { foo: function(num) { counter += num; } },
      ];

      addon._eachProjectAddonInvoke('foo', [1]);
      expect(counter).to.eql(2);
    });

    it('should provide default arguments if none are specified', function() {
      var counter = 0;
      project.addons = [
        { foo: function() { counter += 1; } },
        { foo: function() { counter += 1; } },
      ];

      addon._eachProjectAddonInvoke('foo');
      expect(counter).to.eql(2);
    });
  });

  if (experiments.ADDON_TREE_CACHING) {
    describe('addon tree caching', function() {
      var projectPath = path.resolve(fixturePath, 'simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      function createAddon(Addon) {
        var cli = new MockCLI();
        var project = new Project(projectPath, packageContents, cli.ui, cli);
        return new Addon(project, project);
      }

      describe('cacheKeyForTree', function() {
        it('returns null if `treeForApp` methods are implemented for the app tree', function() {
          var addon = createAddon(Addon.extend({
            name: 'test-project',
            root: 'foo',
            treeForApp: function() { },
          }));

          expect(addon[experiments.ADDON_TREE_CACHING]('app')).to.equal(null);
        });

        it('returns null if `compileAddon` methods are implemented for the addon tree', function() {
          var addon = createAddon(Addon.extend({
            name: 'test-project',
            root: 'foo',
            compileAddon: function() { },
          }));

          expect(addon[experiments.ADDON_TREE_CACHING]('addon')).to.equal(null);
        });

        it('returns null if `treeForMethods` is modified', function() {
          var addon = createAddon(Addon.extend({
            name: 'test-project',
            root: 'foo',
            init: function() {
              this._super && this._super.init.apply(this, arguments);

              this.treeForMethods['app'] = 'treeForZOMG_WHY!?!';
            },
          }));

          expect(addon[experiments.ADDON_TREE_CACHING]('app')).to.equal(null);
        });

        it('returns stable value for repeated invocations', function() {
          var addon = createAddon(Addon.extend({
            name: 'test-project',
            root: 'foo',
          }));

          var firstResult = addon[experiments.ADDON_TREE_CACHING]('app');
          var secondResult = addon[experiments.ADDON_TREE_CACHING]('app');

          expect(firstResult).to.equal(secondResult);
        });
      });

      describe('treeFor caching', function() {
        it('defining custom treeForAddon without modifying cacheKeyForTree does not cache', function() {
          var addon = createAddon(Addon.extend({
            name: 'test-project',
            root: path.join(projectPath, 'node_modules', 'ember-generated-with-export-addon'),
            treeForAddon: function(tree) {
              return tree;
            },
          }));

          var firstTree = addon.treeFor('addon');
          var secondTree = addon.treeFor('addon');

          expect(firstTree).not.to.equal(secondTree);
        });

        it('defining custom cacheKeyForTree allows addon control of cache', function() {
          var addonProto = {
            name: 'test-project',
            root: path.join(projectPath, 'node_modules', 'ember-generated-with-export-addon'),
            treeForAddon: function(tree) {
              return tree;
            },
          };
          addonProto[experiments.ADDON_TREE_CACHING] = function(type) {
            return type;
          };

          var addon = createAddon(Addon.extend(addonProto));
          var firstTree = addon.treeFor('addon');
          var secondTree = addon.treeFor('addon');

          expect(firstTree).to.equal(secondTree);
        });
      });
    });
  }
});
