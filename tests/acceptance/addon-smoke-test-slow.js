'use strict';

const path = require('path');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;
const execa = require('execa');
const chalk = require('chalk');

const runCommand = require('../helpers/run-command');
const acceptance = require('../helpers/acceptance');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

const { expect } = require('chai');
const { dir } = require('chai-files');

let addonName = 'some-cool-addon';
let addonRoot;

describe('Acceptance: addon-smoke-test', function () {
  this.timeout(450000);

  before(function () {
    return createTestTargets(addonName, {
      command: 'addon',
    });
  });

  after(teardownTestTargets);

  beforeEach(function () {
    addonRoot = linkDependencies(addonName);

    process.env.JOBS = '1';
  });

  afterEach(function () {
    runCommand.killAll();
    // Cleans up a folder set up on the other side of a symlink.
    fs.removeSync(path.join(addonRoot, 'node_modules', 'developing-addon'));

    cleanupRun(addonName);
    expect(dir(addonRoot)).to.not.exist;

    delete process.env.JOBS;
  });

  it('generates package.json with proper metadata', function () {
    let packageContents = fs.readJsonSync('package.json');

    expect(packageContents.name).to.equal(addonName);
    expect(packageContents.private).to.be.an('undefined');
    expect(packageContents.keywords).to.deep.equal(['ember-addon']);
    expect(packageContents['ember-addon']).to.deep.equal({ configPath: 'tests/dummy/config' });
  });

  it('npm pack does not include unnecessary files', async function () {
    let handleError = function (error, commandName) {
      if (error.code === 'ENOENT') {
        console.warn(chalk.yellow(`      Your system does not provide ${commandName} -> Skipped this test.`));
      } else {
        throw new Error(error);
      }
    };

    try {
      await npmPack();
    } catch (error) {
      return handleError(error, 'npm');
    }

    let output;
    try {
      let result = await tar();
      output = result.stdout;
    } catch (error) {
      return handleError(error, 'tar');
    }

    let necessaryFiles = ['package.json', 'index.js', 'LICENSE.md', 'README.md'];
    let unnecessaryFiles = ['.gitkeep', '.travis.yml', '.editorconfig', 'testem.js', '.ember-cli'];
    let unnecessaryFolders = [/^tests\//];
    let outputFiles = output
      .split('\n')
      .filter(Boolean)
      .map((f) => f.replace(/^package\//, ''));

    expect(outputFiles, 'verify our assumptions about the output structure').to.include.members(necessaryFiles);

    expect(outputFiles).to.not.have.members(unnecessaryFiles);

    for (let unnecessaryFolder of unnecessaryFolders) {
      for (let outputFile of outputFiles) {
        expect(outputFile).to.not.match(unnecessaryFolder);
      }
    }
  });
});

function npmPack() {
  return new Promise((resolve, reject) => {
    let npmPack = spawn('npm', ['pack']);
    npmPack.on('error', reject);
    npmPack.on('close', () => resolve());
  });
}

async function tar() {
  let fileName = `${addonName}-0.0.0.tgz`;

  if (fs.existsSync(fileName) === false) {
    throw new Error(`unknown file: '${path.resolve(fileName)}'`);
  }

  return execa('tar', ['-tf', fileName]);
}
