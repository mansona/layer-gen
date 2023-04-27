'use strict';

const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');

const acceptance = require('../helpers/acceptance');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
const ember = require('../helpers/ember');
const runCommand = require('../helpers/run-command');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

const { expect } = require('chai');
const { dir, file } = require('chai-files');

let appName = 'some-cool-app';
let appRoot;

// TODO this requires the project polyfill
describe.skip('Acceptance: smoke-test', function () {
  this.timeout(500000);
  before(function () {
    return createTestTargets(appName);
  });

  after(teardownTestTargets);

  beforeEach(function () {
    appRoot = linkDependencies(appName);
  });

  afterEach(function () {
    delete process.env._TESTEM_CONFIG_JS_RAN;
    runCommand.killAll();
    cleanupRun(appName);
    expect(dir(appRoot)).to.not.exist;
  });

  it('ember new foo, make sure addon template overwrites', async function () {
    await ember(['generate', 'template', 'foo']);
    await ember(['generate', 'in-repo-addon', 'my-addon']);

    // this should work, but generating a template in an addon/in-repo-addon doesn't
    // do the right thing: update once https://github.com/ember-cli/ember-cli/issues/5687
    // is fixed
    //return ember(['generate', 'template', 'foo', '--in-repo-addon=my-addon']);

    // temporary work around
    let templatePath = path.join('lib', 'my-addon', 'app', 'templates', 'foo.hbs');
    let packageJsonPath = path.join('lib', 'my-addon', 'package.json');

    fs.mkdirsSync(path.dirname(templatePath));
    fs.writeFileSync(templatePath, 'Hi, Mom!', { encoding: 'utf8' });

    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies['ember-cli-htmlbars'] = '*';

    fs.writeJsonSync(packageJsonPath, packageJson);
  });

  it('eslint passes after running ember new', async function () {
    let result = await runCommand(path.join('.', 'node_modules', 'eslint', 'bin', 'eslint.js'), appRoot);

    let exitCode = result.code;

    expect(exitCode).to.equal(0, 'exit code should be 0 for passing tests');
    expect(result.output).to.be.empty;
  });

  it('ember can override and reuse the built-in blueprints', async function () {
    await copyFixtureFiles('addon/with-blueprint-override');

    await runCommand(path.join('.', 'node_modules', 'layer-gen', 'bin', 'gen'), 'generate', 'component', 'foo-bar');

    let filePath = 'app/components/new-path/foo-bar.js';

    // because we're overriding, the fileMapTokens is default, sans 'component'
    expect(file(filePath)).to.contain('generated component successfully');
  });

  describe('lint fixing after file generation', function () {
    beforeEach(async function () {
      await copyFixtureFiles('app/with-blueprint-override-lint-fail');
    });

    let componentName = 'foo-bar';

    it('does not fix lint errors with --no-lint-fix', async function () {
      await ember(['generate', 'component', componentName, '--component-class=@ember/component', '--no-lint-fix']);

      await expect(execa('eslint', ['.'], { cwd: appRoot, preferLocal: true })).to.eventually.be.rejectedWith(
        `${componentName}.js`
      );
      await expect(
        execa('ember-template-lint', ['.'], { cwd: appRoot, preferLocal: true })
      ).to.eventually.be.rejectedWith(`${componentName}.hbs`);
    });

    it('does fix lint errors with --lint-fix', async function () {
      await ember(['generate', 'component', componentName, '--component-class=@ember/component', '--lint-fix']);

      await expect(execa('eslint', ['.'], { cwd: appRoot, preferLocal: true })).to.eventually.be.ok;
      await expect(execa('ember-template-lint', ['.'], { cwd: appRoot, preferLocal: true })).to.eventually.be.ok;
    });
  });
});
